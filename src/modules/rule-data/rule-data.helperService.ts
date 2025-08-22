import { Injectable } from "@nestjs/common";
import { RuleDataService } from "./rule-data.service";
import { firstValueFrom } from "rxjs";
import { ACCAuthService } from "../acc-auth/acc-auth.service";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Rule1, Rule2, Rule3, Rule4, Rule5 } from "../../shared/entities/index";
import { Repository } from "typeorm";

@Injectable()
export class RuleDataHelperService {

    private endpoint = 'https://developer.api.autodesk.com/aec/graphql';

    constructor(
        private readonly accAuthService: ACCAuthService,
        private readonly http: HttpService,
        @InjectRepository(Rule1) private readonly rule1Repository: Repository<Rule1>,
        @InjectRepository(Rule2) private readonly rule2Repository: Repository<Rule2>,
        @InjectRepository(Rule3) private readonly rule3Repository: Repository<Rule3>,
        @InjectRepository(Rule4) private readonly rule4Repository: Repository<Rule4>,
        @InjectRepository(Rule5) private readonly rule5Repository: Repository<Rule5>,
    ) {}

    private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
        try {
          const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
          const requestBody = { query, variables };
          const response = await firstValueFrom(
            this.http.post(
              this.endpoint,
              requestBody,
              { headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                } },
            ),
          );
          console.log('response');
          console.dir(response.data, { depth: null });
          if (response.data.errors) throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
          const result = response.data.data;
          return result;
        } catch (error) {
          throw error;
        }
    }

    async rule1(elementGroupId: string, accUserId: string) {
      const DOC_QUERY = `
        query ($elementGroupId: ID!, $propertyFilter: String!, $cursor: String, $limit: Int = 500) {
          elementsByElementGroup(
            elementGroupId: $elementGroupId,
            filter: { query: $propertyFilter },
            pagination: { cursor: $cursor, limit: $limit }
          ) {
            pagination { cursor }
            results {
              id
              name
              properties {
                results {
                  name
                  value
                  definition { units { name } }
                }
              }
            }
          }
        }`;

        const LIMIT = 500; // keep pagination large
        const MAX_RETRIES = 4; // 1 try + 3 retries
        const BASE_BACKOFF_MS = 800; // backoff base
        const JITTER_MS = 300; // random jitter to avoid thundering herd
        const propertyFilter = `property.name.category==Doors`;

        type OutRow = {
          ruleId: string;
          name: string;
          elementName?: string;
          width?: String;
          familyName?: string;
          elementContext?: any;
          elementId?: string | number;
        };

        const resultsOut: OutRow[] = [];

        // ---- helpers ----
        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

        const getProp = (props: any[], candidates: string[]) => {
          if (!Array.isArray(props)) return undefined;
          const byName = new Map(
            props.map((p) => [String(p?.name ?? '').toLowerCase(), p]),
          );
          for (const c of candidates) {
            const hit = byName.get(c.toLowerCase());
            if (
              hit &&
              hit.value !== undefined &&
              hit.value !== null &&
              hit.value !== ''
            )
              return hit;
          }
          return undefined;
        };

        const toNum = (v: any) => {
          if (typeof v === 'number') return v;
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        };

        const hasLift = (s: string) => /\blift\b/i.test(s);
        const hasLobby = (s: string) => /\blobby\b/i.test(s);

        const fetchPageWithRetry = async (cursor: string | null) => {
          let attempt = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              const resp = await this.queryGraphQL(
                DOC_QUERY,
                { elementGroupId, propertyFilter, cursor, limit: LIMIT },
                accUserId,
              );

              // GraphQL-level errors (not transport)
              const gqlErrors = resp?.errors ?? resp?.data?.errors;
              if (Array.isArray(gqlErrors) && gqlErrors.length) {
                const codes = gqlErrors.map((e: any) => e?.extensions?.code);
                // Retry on REQUEST_TIMEOUT; otherwise bubble up
                if (codes.includes('REQUEST_TIMEOUT')) {
                  throw Object.assign(new Error('REQUEST_TIMEOUT'), {
                    retriable: true,
                  });
                }
                const msg = `GraphQL errors: ${JSON.stringify(gqlErrors)}`;
                throw Object.assign(new Error(msg), { retriable: false });
              }

              const block =
                resp?.elementsByElementGroup ?? resp?.data?.elementsByElementGroup;
              return block;
            } catch (err: any) {
              const isTimeout =
                err?.retriable === true ||
                err?.response?.status === 504 ||
                err?.code === 'ECONNRESET' ||
                err?.code === 'ETIMEDOUT';

              if (isTimeout && attempt < MAX_RETRIES) {
                const backoff =
                  BASE_BACKOFF_MS * Math.pow(2, attempt) +
                  Math.floor(Math.random() * JITTER_MS);
                attempt += 1;
                await delay(backoff);
                continue; // retry same page
              }
              // Non-retriable or retries exhausted
              throw err;
            }
          }
        };

        // ---- pagination loop ----
        let cursor: string | null = null;

        do {
          const block = await fetchPageWithRetry(cursor);
          console.log('block');
          console.dir(block, { depth: null });

          const pageItems = block?.results ?? [];
          for (const el of pageItems) {
            const elName = String(el?.name ?? '');
            // Post-filter: Name must contain 'LIFT' and NOT contain 'LOBBY'
            if (!hasLift(elName) || hasLobby(elName)) continue;

            const props = el?.properties?.results ?? [];

            const pElementName = getProp(props, ['Element Name']);
            const pElementCtx = getProp(props, ['Element Context']);
            const pFamilyName = getProp(props, ['Family Name']);
            const pWidth = getProp(props, ['Width']);
            const pElementId = getProp(props, ['Element Id']);

            resultsOut.push({
              ruleId: el.id,
              name: elName,
              elementName: pElementName?.value ?? undefined,
              width: pWidth?.value ?? undefined,
              familyName: pFamilyName?.value ?? undefined,
              elementContext: pElementCtx?.value ?? undefined,
              elementId: pElementId?.value ?? undefined,
            });
          }

          cursor = block?.pagination?.cursor ?? null;
        } while (cursor);

        console.log('resultsOut');
        console.dir(resultsOut, { depth: null });

        const entities: Rule1[] = resultsOut.map((item) =>
          this.rule1Repository.create({
            ruleId: item.ruleId,
            name: item.name ?? '',
            elementGroupId,
            accUserId,
            width: item.width?.toString() ?? '',
            familyName: item.familyName?.toString() ?? '',
            elementContext: item.elementContext?.toString() ?? '',
            elementId: item.elementId?.toString() ?? '',
            createdAt: new Date(),
          })
        );
        await this.rule1Repository.save(entities, { chunk: 500 });
        return { message: 'Rule1 data has been saved successfully' };
    }

    async rule2(elementGroupId: string, accUserId: string) {
      const DOC_QUERY = `
      query ($elementGroupId: ID!, $propertyFilter: String!, $cursor: String, $limit: Int = 500) {
        elementsByElementGroup(
          elementGroupId: $elementGroupId,
          filter: { query: $propertyFilter },
          pagination: { cursor: $cursor, limit: $limit }
        ) {
          pagination { cursor }
          results {
            id
            name
            properties {
              results {
                name
                value
                definition { units { name } }
              }
            }
          }
        }
      }`;

      const LIMIT = 500; // keep pagination large
      const MAX_RETRIES = 4; // 1 try + 3 retries
      const BASE_BACKOFF_MS = 800; // backoff base
      const JITTER_MS = 300; // random jitter to avoid thundering herd
      const propertyFilter = `property.name.category==Parking and 'property.name.Element Context'==Instance`;

      type OutRow = {
        ruleId: string;
        elementGroupId: string;
        name: string;
        elementId: string;
        levelName: string;
        accUserId: string;
        elementContext: string;
      };

      const resultsOut: OutRow[] = [];

      // ---- helpers ----
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      const getProp = (props: any[], candidates: string[]) => {
        if (!Array.isArray(props)) return undefined;
        const byName = new Map(
          props.map((p) => [String(p?.name ?? '').toLowerCase(), p]),
        );
        for (const c of candidates) {
          const hit = byName.get(c.toLowerCase());
          if (
            hit &&
            hit.value !== undefined &&
            hit.value !== null &&
            hit.value !== ''
          )
            return hit;
        }
        return undefined;
      };

      const toNum = (v: any) => {
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const hasLift = (s: string) => /\blift\b/i.test(s);
      const hasLobby = (s: string) => /\blobby\b/i.test(s);

      const fetchPageWithRetry = async (cursor: string | null) => {
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const resp = await this.queryGraphQL(
              DOC_QUERY,
              { elementGroupId, propertyFilter, cursor, limit: LIMIT },
              accUserId,
            );

            // GraphQL-level errors (not transport)
            const gqlErrors = resp?.errors ?? resp?.data?.errors;
            if (Array.isArray(gqlErrors) && gqlErrors.length) {
              const codes = gqlErrors.map((e: any) => e?.extensions?.code);
              // Retry on REQUEST_TIMEOUT; otherwise bubble up
              if (codes.includes('REQUEST_TIMEOUT')) {
                throw Object.assign(new Error('REQUEST_TIMEOUT'), {
                  retriable: true,
                });
              }
              const msg = `GraphQL errors: ${JSON.stringify(gqlErrors)}`;
              throw Object.assign(new Error(msg), { retriable: false });
            }

            const block =
              resp?.elementsByElementGroup ?? resp?.data?.elementsByElementGroup;
            return block;
          } catch (err: any) {
            const isTimeout =
              err?.retriable === true ||
              err?.response?.status === 504 ||
              err?.code === 'ECONNRESET' ||
              err?.code === 'ETIMEDOUT';

            if (isTimeout && attempt < MAX_RETRIES) {
              const backoff =
                BASE_BACKOFF_MS * Math.pow(2, attempt) +
                Math.floor(Math.random() * JITTER_MS);
              attempt += 1;
              await delay(backoff);
              continue; // retry same page
            }
            // Non-retriable or retries exhausted
            throw err;
          }
        }
      };

      // ---- pagination loop ----
      let cursor: string | null = null;

      do {
        const block = await fetchPageWithRetry(cursor);

        const pageItems = block?.results ?? [];
        for (const el of pageItems) {
          const elName = String(el?.name ?? '');
          // Post-filter: Name must contain 'LIFT' and NOT contain 'LOBBY'
          if (!hasLift(elName) || hasLobby(elName)) continue;

          const props = el?.properties?.results ?? [];

          const pElementCtx = getProp(props, ['Element Context']);
          const pLevelName = getProp(props, ['Host']);
          const pElementId = getProp(props, ['Revit Element Id']);

          resultsOut.push({
            ruleId: el.id,
            elementGroupId: elementGroupId,
            name: elName,
            elementId: pElementId?.value ?? undefined,
            levelName: pLevelName?.value ?? undefined,
            accUserId: accUserId,
            elementContext: pElementCtx?.value ?? undefined,
          });
        }

        cursor = block?.pagination?.cursor ?? null;
      } while (cursor);

      const entities: Rule2[] = resultsOut.map((item) =>
        this.rule2Repository.create({
          ruleId: item.ruleId,
          elementGroupId: item.elementGroupId,
          name: item.name ?? '',
          elementId: item.elementId ?? '',
          levelName: item.levelName ?? '',
          accUserId: item.accUserId,
          elementContext: item.elementContext ?? '',
          createdAt: new Date(),
        })
      );
      await this.rule2Repository.save(entities, { chunk: 500 });
      return { message: 'Rule2 data has been saved successfully' };
    }

    async rule3(elementGroupId: string, accUserId: string) {
      const DOC_QUERY = `
      query ($elementGroupId: ID!, $propertyFilter: String!, $cursor: String, $limit: Int = 500) {
        elementsByElementGroup(
          elementGroupId: $elementGroupId,
          filter: { query: $propertyFilter },
          pagination: { cursor: $cursor, limit: $limit }
        ) {
          pagination { cursor }
          results {
            id
            name
            properties {
              results {
                name
                value
                definition { units { name } }
              }
            }
          }
        }
      }`;

      const LIMIT = 500; // keep pagination large
      const MAX_RETRIES = 4; // 1 try + 3 retries
      const BASE_BACKOFF_MS = 800; // backoff base
      const JITTER_MS = 300; // random jitter to avoid thundering herd
      const propertyFilter = `property.name.category==Ramps`;

      type OutRow = {
        ruleId: string;
        elementGroupId: string;
        name: string;
        elementId: string;
        width: string;
        accUserId: string;
        elementContext: string;
      };

      const resultsOut: OutRow[] = [];

      // ---- helpers ----
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      const getProp = (props: any[], candidates: string[]) => {
        if (!Array.isArray(props)) return undefined;
        const byName = new Map(
          props.map((p) => [String(p?.name ?? '').toLowerCase(), p]),
        );
        for (const c of candidates) {
          const hit = byName.get(c.toLowerCase());
          if (
            hit &&
            hit.value !== undefined &&
            hit.value !== null &&
            hit.value !== ''
          )
            return hit;
        }
        return undefined;
      };

      const toNum = (v: any) => {
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const hasLift = (s: string) => /\blift\b/i.test(s);
      const hasLobby = (s: string) => /\blobby\b/i.test(s);

      const fetchPageWithRetry = async (cursor: string | null) => {
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const resp = await this.queryGraphQL(
              DOC_QUERY,
              { elementGroupId, propertyFilter, cursor, limit: LIMIT },
              accUserId,
            );

            // GraphQL-level errors (not transport)
            const gqlErrors = resp?.errors ?? resp?.data?.errors;
            if (Array.isArray(gqlErrors) && gqlErrors.length) {
              const codes = gqlErrors.map((e: any) => e?.extensions?.code);
              // Retry on REQUEST_TIMEOUT; otherwise bubble up
              if (codes.includes('REQUEST_TIMEOUT')) {
                throw Object.assign(new Error('REQUEST_TIMEOUT'), {
                  retriable: true,
                });
              }
              const msg = `GraphQL errors: ${JSON.stringify(gqlErrors)}`;
              throw Object.assign(new Error(msg), { retriable: false });
            }

            const block =
              resp?.elementsByElementGroup ?? resp?.data?.elementsByElementGroup;
            return block;
          } catch (err: any) {
            const isTimeout =
              err?.retriable === true ||
              err?.response?.status === 504 ||
              err?.code === 'ECONNRESET' ||
              err?.code === 'ETIMEDOUT';

            if (isTimeout && attempt < MAX_RETRIES) {
              const backoff =
                BASE_BACKOFF_MS * Math.pow(2, attempt) +
                Math.floor(Math.random() * JITTER_MS);
              attempt += 1;
              await delay(backoff);
              continue; // retry same page
            }
            // Non-retriable or retries exhausted
            throw err;
          }
        }
      };

      // ---- pagination loop ----
      let cursor: string | null = null;

      do {
        const block = await fetchPageWithRetry(cursor);

        const pageItems = block?.results ?? [];
        for (const el of pageItems) {
          const elName = String(el?.name ?? '');
          // Post-filter: Name must contain 'LIFT' and NOT contain 'LOBBY'
          if (!hasLift(elName) || hasLobby(elName)) continue;

          const props = el?.properties?.results ?? [];

          const pElementCtx = getProp(props, ['Element Context']);
          const pWidth = getProp(props, ['Width']);
          const pElementId = getProp(props, ['Revit Element Id']);

          resultsOut.push({
            ruleId: el.id,
            elementGroupId: elementGroupId,
            name: elName,
            elementId: pElementId?.value ?? undefined,
            width: pWidth?.value ?? undefined,
            accUserId: accUserId,
            elementContext: pElementCtx?.value ?? undefined,
          });
        }

        cursor = block?.pagination?.cursor ?? null;
      } while (cursor);

      const entities: Rule3[] = resultsOut.map((item) =>
        this.rule3Repository.create({
          ruleId: item.ruleId,
          elementGroupId: item.elementGroupId,
          name: item.name ?? '',
          elementId: item.elementId ?? '',
          width: item.width ?? '',
          accUserId: item.accUserId,
          elementContext: item.elementContext ?? '',
          createdAt: new Date(),
        })
      );
      await this.rule3Repository.save(entities, { chunk: 500 });
      return { message: 'Rule3 data has been saved successfully' };
    }

    async rule4(elementGroupId: string, accUserId: string) {
      const DOC_QUERY = `
      query ($elementGroupId: ID!, $propertyFilter: String!, $cursor: String, $limit: Int = 500) {
        elementsByElementGroup(
          elementGroupId: $elementGroupId,
          filter: { query: $propertyFilter },
          pagination: { cursor: $cursor, limit: $limit }
        ) {
          pagination { cursor }
          results {
            id
            name
            properties {
              results {
                name
                value
                definition { units { name } }
              }
            }
          }
        }
      }`;

      const LIMIT = 500; // keep pagination large
      const MAX_RETRIES = 4; // 1 try + 3 retries
      const BASE_BACKOFF_MS = 800; // backoff base
      const JITTER_MS = 300; // random jitter to avoid thundering herd
      const propertyFilter = `property.name.category==Stairs`;

      type OutRow = {
        ruleId: string;
        elementGroupId: string;
        name: string;
        elementId: string;
        familyName: string;
        stairsMaxRiserHeight: string;
        accUserId: string;
        elementContext: string;
      };

      const resultsOut: OutRow[] = [];

      // ---- helpers ----
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      const getProp = (props: any[], candidates: string[]) => {
        if (!Array.isArray(props)) return undefined;
        const byName = new Map(
          props.map((p) => [String(p?.name ?? '').toLowerCase(), p]),
        );
        for (const c of candidates) {
          const hit = byName.get(c.toLowerCase());
          if (
            hit &&
            hit.value !== undefined &&
            hit.value !== null &&
            hit.value !== ''
          )
            return hit;
        }
        return undefined;
      };

      const toNum = (v: any) => {
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const hasLift = (s: string) => /\blift\b/i.test(s);
      const hasLobby = (s: string) => /\blobby\b/i.test(s);

      const fetchPageWithRetry = async (cursor: string | null) => {
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const resp = await this.queryGraphQL(
              DOC_QUERY,
              { elementGroupId, propertyFilter, cursor, limit: LIMIT },
              accUserId,
            );

            // GraphQL-level errors (not transport)
            const gqlErrors = resp?.errors ?? resp?.data?.errors;
            if (Array.isArray(gqlErrors) && gqlErrors.length) {
              const codes = gqlErrors.map((e: any) => e?.extensions?.code);
              // Retry on REQUEST_TIMEOUT; otherwise bubble up
              if (codes.includes('REQUEST_TIMEOUT')) {
                throw Object.assign(new Error('REQUEST_TIMEOUT'), {
                  retriable: true,
                });
              }
              const msg = `GraphQL errors: ${JSON.stringify(gqlErrors)}`;
              throw Object.assign(new Error(msg), { retriable: false });
            }

            const block =
              resp?.elementsByElementGroup ?? resp?.data?.elementsByElementGroup;
            return block;
          } catch (err: any) {
            const isTimeout =
              err?.retriable === true ||
              err?.response?.status === 504 ||
              err?.code === 'ECONNRESET' ||
              err?.code === 'ETIMEDOUT';

            if (isTimeout && attempt < MAX_RETRIES) {
              const backoff =
                BASE_BACKOFF_MS * Math.pow(2, attempt) +
                Math.floor(Math.random() * JITTER_MS);
              attempt += 1;
              await delay(backoff);
              continue; // retry same page
            }
            // Non-retriable or retries exhausted
            throw err;
          }
        }
      };

      // ---- pagination loop ----
      let cursor: string | null = null;

      do {
        const block = await fetchPageWithRetry(cursor);

        const pageItems = block?.results ?? [];
        for (const el of pageItems) {
          const elName = String(el?.name ?? '');
          // Post-filter: Name must contain 'LIFT' and NOT contain 'LOBBY'
          if (!hasLift(elName) || hasLobby(elName)) continue;

          const props = el?.properties?.results ?? [];

          const pElementCtx = getProp(props, ['Element Context']);
          const pFamilyName = getProp(props, ['Family Name']);
          const pStairsMaxRiserHeight = getProp(props, ['Maximum Riser Height']);
          const pElementId = getProp(props, ['Revit Element Id']);

          resultsOut.push({
            ruleId: el.id,
            elementGroupId: elementGroupId,
            name: elName,
            elementId: pElementId?.value ?? undefined,
            familyName: pFamilyName?.value ?? undefined,
            stairsMaxRiserHeight: pStairsMaxRiserHeight?.value ?? undefined,
            accUserId: accUserId,
            elementContext: pElementCtx?.value ?? undefined,
          });
        }

        cursor = block?.pagination?.cursor ?? null;
      } while (cursor);

      const entities: Rule4[] = resultsOut.map((item) =>
        this.rule4Repository.create({
          ruleId: item.ruleId,
          elementGroupId: item.elementGroupId,
          name: item.name ?? '',
          elementId: item.elementId ?? '',
          familyName: item.familyName ?? '',
          stairsMaxRiserHeight: item.stairsMaxRiserHeight ?? '',
          accUserId: item.accUserId,
          elementContext: item.elementContext ?? '',
          createdAt: new Date(),
        })
      );
      await this.rule4Repository.save(entities, { chunk: 500 });
      return { message: 'Rule4 data has been saved successfully' };
    }

    async rule5(elementGroupId: string, accUserId: string) {
        const DOC_QUERY = `
        query ($elementGroupId: ID!, $propertyFilter: String!, $cursor: String, $limit: Int = 500) {
          elementsByElementGroup(
            elementGroupId: $elementGroupId,
            filter: { query: $propertyFilter },
            pagination: { cursor: $cursor, limit: $limit }
          ) {
            pagination { cursor }
            results {
              id
              name
              properties {
                results {
                  name
                  value
                  definition { units { name } }
                }
              }
            }
          }
        }`;

        const LIMIT = 500; // keep pagination large
        const MAX_RETRIES = 4; // 1 try + 3 retries
        const BASE_BACKOFF_MS = 800; // backoff base
        const JITTER_MS = 300; // random jitter to avoid thundering herd
        const propertyFilter = `property.name.category==Rooms`;

        type OutRow = {
          id: string;
          name: string;
          elementName?: string;
          elementContext?: any;
          area?: number;
          perimeter?: number;
          revitElementId?: string | number;
          familyName?: string;
        };

        const resultsOut: OutRow[] = [];

        // ---- helpers ----
        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

        const getProp = (props: any[], candidates: string[]) => {
          if (!Array.isArray(props)) return undefined;
          const byName = new Map(
            props.map((p) => [String(p?.name ?? '').toLowerCase(), p]),
          );
          for (const c of candidates) {
            const hit = byName.get(c.toLowerCase());
            if (
              hit &&
              hit.value !== undefined &&
              hit.value !== null &&
              hit.value !== ''
            )
              return hit;
          }
          return undefined;
        };

        const toNum = (v: any) => {
          if (typeof v === 'number') return v;
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        };

        const hasLift = (s: string) => /\blift\b/i.test(s);
        const hasLobby = (s: string) => /\blobby\b/i.test(s);

        const fetchPageWithRetry = async (cursor: string | null) => {
          let attempt = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              const resp = await this.queryGraphQL(
                DOC_QUERY,
                { elementGroupId, propertyFilter, cursor, limit: LIMIT },
                accUserId,
              );

              // GraphQL-level errors (not transport)
              const gqlErrors = resp?.errors ?? resp?.data?.errors;
              if (Array.isArray(gqlErrors) && gqlErrors.length) {
                const codes = gqlErrors.map((e: any) => e?.extensions?.code);
                // Retry on REQUEST_TIMEOUT; otherwise bubble up
                if (codes.includes('REQUEST_TIMEOUT')) {
                  throw Object.assign(new Error('REQUEST_TIMEOUT'), {
                    retriable: true,
                  });
                }
                const msg = `GraphQL errors: ${JSON.stringify(gqlErrors)}`;
                throw Object.assign(new Error(msg), { retriable: false });
              }

              const block =
                resp?.elementsByElementGroup ?? resp?.data?.elementsByElementGroup;
              return block;
            } catch (err: any) {
              const isTimeout =
                err?.retriable === true ||
                err?.response?.status === 504 ||
                err?.code === 'ECONNRESET' ||
                err?.code === 'ETIMEDOUT';

              if (isTimeout && attempt < MAX_RETRIES) {
                const backoff =
                  BASE_BACKOFF_MS * Math.pow(2, attempt) +
                  Math.floor(Math.random() * JITTER_MS);
                attempt += 1;
                await delay(backoff);
                continue; // retry same page
              }
              // Non-retriable or retries exhausted
              throw err;
            }
          }
        };

        // ---- pagination loop ----
        let cursor: string | null = null;

        do {
          const block = await fetchPageWithRetry(cursor);

          const pageItems = block?.results ?? [];
          for (const el of pageItems) {
            const elName = String(el?.name ?? '');
            // Post-filter: Name must contain 'LIFT' and NOT contain 'LOBBY'
            if (!hasLift(elName) || hasLobby(elName)) continue;

            const props = el?.properties?.results ?? [];

            const pElementName = getProp(props, [
              'Element Name',
              'Room Name',
              'Name',
              'Type Name',
            ]);
            const pElementCtx = getProp(props, [
              'Element Context',
              'Context',
              'Category',
            ]);
            const pFamilyName = getProp(props, ['Family Name']);
            const pArea = getProp(props, ['Area', 'Room Area']);
            const pPerimeter = getProp(props, ['Perimeter', 'Room Perimeter']);
            const pRevitId = getProp(props, [
              'Element Id',
              'Revit Element Id',
              'RevitElementId',
            ]);

            resultsOut.push({
              id: el.id,
              name: elName,
              elementName: pElementName?.value ?? undefined,
              elementContext: pElementCtx?.value ?? undefined,
              area: toNum(pArea?.value),
              perimeter: toNum(pPerimeter?.value),
              revitElementId: pRevitId?.value,
              familyName: pFamilyName?.value ?? undefined,
            });
          }

          cursor = block?.pagination?.cursor ?? null;
        } while (cursor);

        const entities: Rule5[] = resultsOut.map((item) =>
          this.rule5Repository.create({
            ruleId: item.id,
            elementGroupId: elementGroupId,
            elementId: item.revitElementId?.toString() ?? '',
            name: item.name ?? '',
            elementName: item.elementName ?? '',
            elementContext: item.elementContext ?? '',
            area: item.area?.toString() ?? '',
            perimeter: item.perimeter?.toString() ?? '',
            revitElementId: item.revitElementId?.toString() ?? '',
            familyName: item.familyName ?? '',
            accUserId: accUserId,
            createdAt: new Date(),
          })
        );
        await this.rule5Repository.save(entities, { chunk: 500 });
        return { message: 'Rule5 data has been saved successfully' };
    }

}