import { Inject, Injectable } from '@nestjs/common';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Redis } from 'ioredis';

export interface ValidationResult {
  typeId: string;
  typeName: string;
  familyName: string;
  widthMm?: number;
  isValid: boolean;
  elementIds: string[];
  stairsMaxRiserHeight?: number;
}

export interface ValidationResponse {
  validationResults: ValidationResult[];
  summary: {
    totalTypesChecked: number;
    failedValidations: number;
    failedWithElementIds: number;
    failedWithoutElementIds: number;
    totalFailedElementInstances: number;
    uniqueElementIds: number;
    duplicateElementIds: number;
    perfectMatchesFound: number;
  };
  failureBreakdown: Record<string, number>;
}

export interface ParkingValidationResult {
  typeId: string;
  typeName: string;
  familyName: string;
  widthMm: number;
  isValid: boolean;
  elementIds: string[];
}

export interface ParkingValidationResponse {
  validationResults: ParkingValidationResult[];
  parkingAnalysis: {
    totalParkingSpaces: number;
    normalParkingSpaces: number;
    handicappedParkingSpaces: number;
    requiredHandicappedSpaces: number;
    actualHandicappedSpaces: number;
    shortfall: number;
    isValidationPassed: boolean;
    validationMessage: string;
  };
  normalParkingBreakdown: {
    [spaceName: string]: {
      count: number;
      elementIds: string[];
    };
  };
  handicappedParkingBreakdown: {
    [spaceName: string]: {
      count: number;
      elementIds: string[];
    };
  };
  summary: {
    totalTypesChecked: number;
    failedValidations: number;
    failedWithElementIds: number;
    failedWithoutElementIds: number;
    totalFailedElementInstances: number;
    uniqueElementIds: number;
    duplicateElementIds: number;
    perfectMatchesFound: number;
  };
  failureBreakdown: Record<string, number>;
}

export interface CachedDoorData {
  res1: Array<{id: string; name: string; FamilyName: string; width: any}>;
  res2: Array<{id: string; name: string; elementID: any; FamilyName: string}>;
}

export interface CachedStairsData {
  res1: Array<{id: string; name: string; FamilyName: string; stairsMaxRiserHeight: any}>;
  res2: Array<{id: string; name: string; elementID: any; FamilyName: string}>;
}

export interface CachedRampData {
  res1: Array<{id: string; name: string; FamilyName: string; Slope: any, InclineLength: any}>;
  res2: Array<{id: string; name: string; elementID: any; FamilyName: string}>;
}

export interface CachedParkingData {
  res: Array<{id: string; name: string; elementID: string; LevelName: any}>;
}


@Injectable()
export class RuleEngineService {
  private endpoint1 = 'https://developer.api.autodesk.com/aec/graphql';

  constructor(
    public accAuthService: ACCAuthService,
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redis: Redis
  ){}

  private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
    try {
      const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
      const requestBody = { query, variables };
      const response = await firstValueFrom(
        this.http.post(
          this.endpoint1,
          requestBody,
          { headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            } },
        ),
      ) as any;
      if (response.data.errors) throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
      const result = response.data.data;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getDoorsInstance(elementGroupId: string, accUserId: string) {
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
  
    const filter = "property.name.category==Doors and 'property.name.Element Context'==Instance";
    let cursor: string | null = null;
    const doorsWithWidth: Array<{id: string; name: string; elementID: any; FamilyName:string }> = [];
  
    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);
  
      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        const elementID = el.properties?.results?.find((p: any) => p.name === "Revit Element ID");
        if (elementID) {
          doorsWithWidth.push({ 
            id: el.id, 
            name: el.name,
            elementID: elementID.value, 
            FamilyName: familyName?.value
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    return doorsWithWidth;
  }

  async getDoorsType(elementGroupId: string, accUserId: string) {
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
  
    const filter = "property.name.category==Doors and 'property.name.Element Context'==Type";
    let cursor: string | null = null;
    const doorsWithWidth: Array<{id: string; name: string; FamilyName:string; width:any }> = [];
  
    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);
  
      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const widthProp = el.properties?.results?.find((p: any) => p.name === "Width");
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        if (widthProp) {
          doorsWithWidth.push({ 
            id: el.id, 
            name: el.name,
            FamilyName: familyName?.value,
            width: widthProp.value 
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    return doorsWithWidth;
  }

  async getCachedDoorData(elementGroupId: string, accUserId: string): Promise<CachedDoorData> {

    const cacheKey = `Cache Key:GET:/rule-engine/getDoorData/${elementGroupId}?accUserId=${accUserId}`;
    const cachedData = await this.redis.get(cacheKey) as CachedDoorData | null;

    if (cachedData) {
        try {
              const parsedData = JSON.parse(cachedData as unknown as string) as CachedDoorData;
          return parsedData;
        } catch (error) {
          await this.redis.del(cacheKey);
        }
      }
    const res1 = await this.getDoorsType(elementGroupId, accUserId);
    const res2 = await this.getDoorsInstance(elementGroupId, accUserId);
    const data: CachedDoorData = {res1,res2};
    await this.cacheManager.set(cacheKey, data, 600);
    return data;
  }

  async executeRule(elementGroupId: string, accUserId: string): Promise<ValidationResponse> {
    try {
      const doorData = await this.getCachedDoorData(elementGroupId, accUserId);
      const typeData = doorData.res1;
      const instanceData = doorData.res2;
  
      const instanceLookupMap = new Map<string, typeof instanceData>();
      
      instanceData.forEach(instance => {
        if (instance.name && instance.FamilyName) {
          const key = `${instance.name}|${instance.FamilyName}`;
          if (!instanceLookupMap.has(key)) {
            instanceLookupMap.set(key, []);
          }
          instanceLookupMap.get(key)!.push(instance);
        }
      });
  
      const MIN_WIDTH_MM = 850;
      const M_TO_MM_MULTIPLIER = 1000;
  
      let perfectMatches = 0;
      let processedCount = 0;
  
      const validationResults: ValidationResult[] = typeData.map((doorType) => {
        const widthMm = doorType.width * M_TO_MM_MULTIPLIER;
        const isValid = widthMm >= MIN_WIDTH_MM;

        const result: ValidationResult = {
          typeId: doorType.id,
          typeName: doorType.name,
          familyName: doorType.FamilyName,
          widthMm: Math.round(widthMm * 100) / 100,
          isValid,
          elementIds: []
        };

        if (!isValid) {
          processedCount++;
          
          const lookupKey = `${doorType.name}|${doorType.FamilyName}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];
          
          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(instance => instance.elementID);
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(result =>
        result.isValid || (result.elementIds.length > 0)
      );

      const failedResults = filteredValidationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);
      
      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;
      
      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach(result => {
        failureBreakdown[result.typeName] = result.elementIds.length;
      });
      
      const summary = {
        totalTypesChecked: filteredValidationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches,
        totalInstancesChecked: instanceData.length
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown
      };
  
    } catch (error) {
      throw error;
    }
  }
  
  async getFailedDoorValidations(elementGroupId: string, accUserId: string): Promise<ValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults.filter(result => !result.isValid);
  }

  async getFailedDoorValidationsWithElements(elementGroupId: string, accUserId: string): Promise<ValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults.filter(result => !result.isValid && result.elementIds.length > 0);
  }
  
  async getDoorValidationSummary(elementGroupId: string, accUserId: string) {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.summary;
  }
  
  async getFailedElementIds(elementGroupId: string, accUserId: string): Promise<string[]> {
    const failedResults = await this.getFailedDoorValidationsWithElements(elementGroupId, accUserId);
    const allElementIds = failedResults.flatMap(result => result.elementIds);
    return [...new Set(allElementIds)];
  }

  async getFailureBreakdown(elementGroupId: string, accUserId: string): Promise<Record<string, number>> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.failureBreakdown;
  }

  async executeRuleLegacy(elementGroupId: string, accUserId: string): Promise<ValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults;
  }


  async getRampsInstance(elementGroupId: string, accUserId: string) {
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
  
    const filter = "property.name.category==Ramps and 'property.name.Element Context'==Instance";
    let cursor: string | null = null;
    const doorsWithWidth: Array<{id: string; name: string; elementID: any; FamilyName:string }> = [];
  
    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);
  
      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        const elementID = el.properties?.results?.find((p: any) => p.name === "Revit Element ID");
        if (elementID) {
          doorsWithWidth.push({ 
            id: el.id, 
            name: el.name,
            elementID: elementID.value, 
            FamilyName: familyName?.value
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    return doorsWithWidth;
  }

  async getRampsType(elementGroupId: string, accUserId: string) {
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
  
    const filter = "property.name.category==Ramps and 'property.name.Element Context'==Type";
    let cursor: string | null = null;
    const doorsWithWidth: Array<{id: string; name: string; FamilyName:string; Slope:any, InclineLength:any }> = [];
  
    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);
  
      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const widthProp = el.properties?.results?.find((p: any) => p.name === "Ramp Max Slope (1/x)");
        const xyzProp = el.properties?.results?.find((p: any) => p.name === "Maximum Incline Length");
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        if (widthProp) {
          doorsWithWidth.push({ 
            id: el.id, 
            name: el.name,
            FamilyName: familyName?.value,
            Slope: widthProp.value,
            InclineLength: xyzProp.value
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    return doorsWithWidth;
  }

  async getCachedRampData(elementGroupId: string, accUserId: string): Promise<CachedRampData> {

    const cacheKey = `Cache Key:GET:/rule-engine/getRampData/${elementGroupId}?accUserId=${accUserId}`;
    const cachedData = await this.redis.get(cacheKey) as CachedRampData | null;

    if (cachedData) {
        try {
              const parsedData = JSON.parse(cachedData as unknown as string) as CachedRampData;
          return parsedData;
        } catch (error) {
          await this.redis.del(cacheKey);
        }
      }
    const res1 = await this.getRampsType(elementGroupId, accUserId);
    const res2 = await this.getRampsInstance(elementGroupId, accUserId);
    const data: CachedRampData = {res1,res2};
    await this.cacheManager.set(cacheKey, data, 600);
    return data;
  }

  async executeRule2(elementGroupId: string, accUserId: string): Promise<ValidationResponse> {
    try {
      const rampData = await this.getCachedRampData(elementGroupId, accUserId);
      const typeData = rampData.res1;
      const instanceData = rampData.res2;
  
      const instanceLookupMap = new Map<string, typeof instanceData>();
      
      instanceData.forEach(instance => {
        if (instance.name && instance.FamilyName) {
          const key = `${instance.name}|${instance.FamilyName}`;
          if (!instanceLookupMap.has(key)) {
            instanceLookupMap.set(key, []);
          }
          instanceLookupMap.get(key)!.push(instance);
        }
      });
  
      const M_TO_MM_MULTIPLIER = 1000;
  
      let perfectMatches = 0;

      const validationResults: ValidationResult[] = typeData.map((rampType) => {
        const inclineLengthMm = rampType.InclineLength * M_TO_MM_MULTIPLIER;
        const verticalRiseMm = (1 / rampType.Slope) * inclineLengthMm;
        
        let requiredMinSlopeRatio: number;
        if (verticalRiseMm > 0 && verticalRiseMm <= 15) {
          requiredMinSlopeRatio = 2; 
        } else if (verticalRiseMm > 15 && verticalRiseMm <= 50) {
          requiredMinSlopeRatio = 5; 
        } else if (verticalRiseMm > 50 && verticalRiseMm <= 200) {
          requiredMinSlopeRatio = 10; 
        } else if (verticalRiseMm > 200) {
          requiredMinSlopeRatio = 12; 
        } else {
          requiredMinSlopeRatio = 2; 
        }
        
        const isValid = rampType.Slope >= requiredMinSlopeRatio;

        const result: ValidationResult = {
          typeId: rampType.id,
          typeName: rampType.name,
          familyName: rampType.FamilyName,
          widthMm: Math.round(verticalRiseMm * 100) / 100, 
          isValid,
          elementIds: []
        };

        if (!isValid) {
          const lookupKey = `${rampType.name}|${rampType.FamilyName}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];
          
          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(instance => instance.elementID);
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(result =>
        result.isValid || (result.elementIds.length > 0)
      );

      const failedResults = filteredValidationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);
      
      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;
      
      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach(result => {
        failureBreakdown[result.typeName] = result.elementIds.length;
      });
      
      const summary = {
        totalTypesChecked: validationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches,
        totalInstancesChecked: instanceData.length
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown
      };
  
    } catch (error) {
      throw error;
    }
  }

  async getParkingInstance(
    elementGroupId: string,
    accUserId: string,
    Levels: string 
  ) {
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
  
    const filter =
      "property.name.category==Parking and 'property.name.Element Context'==Instance";
  
    let cursor: string | null = null;
    const ParkingData: Array<{ id: string; name: string; elementID: any; LevelName: string }> = [];
  
    do {
      const resp = await this.queryGraphQL(
        DOC_QUERY,
        {
          elementGroupId,
          propertyFilter: filter,
          cursor,
          limit: 500,
        },
        accUserId
      );
  
      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const LevelName = el.properties?.results?.find((p: any) => p.name === "Host");
        const elementID = el.properties?.results?.find((p: any) => p.name === "Revit Element ID");
  
        if (elementID) {
          ParkingData.push({
            id: el.id,
            name: el.name,
            elementID: elementID.value,
            LevelName: LevelName?.value ?? "",
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    const filtered = ParkingData.filter(
      (el) => el.LevelName?.toLowerCase() === `level : ${Levels.toLowerCase()}`
    );
  
    return filtered;
  }


  
  

  async getCachedParkingData(elementGroupId: string, accUserId: string, Level: string): Promise<CachedParkingData> {

    const cacheKey = `Cache Key:GET:/rule-engine/getParkingData/${elementGroupId}?accUserId=${accUserId}`;
    const cachedData = await this.redis.get(cacheKey) as CachedParkingData | null;

    if (cachedData) {
        try {
              const parsedData = JSON.parse(cachedData as unknown as string) as CachedParkingData;
          return parsedData;
        } catch (error) {
          await this.redis.del(cacheKey);
        }
      }
    const res = await this.getParkingInstance(elementGroupId, accUserId, Level);
    const data: CachedParkingData = {res};
    await this.cacheManager.set(cacheKey, data, 600);
    return data;
  }
  async executeRule3(elementGroupId: string, accUserId: string, levelName: string): Promise<ParkingValidationResponse> {
    try {
      const parkingJson = await this.getCachedParkingData(elementGroupId, accUserId, levelName);
      
      const handicappedSpaces = parkingJson.res.filter(parking => 
        parking.name.toLowerCase().includes('hcp') || 
        parking.name.toLowerCase().includes('handicapped')
      );
      
      const normalSpaces = parkingJson.res.filter(parking => 
        !parking.name.toLowerCase().includes('hcp') && 
        !parking.name.toLowerCase().includes('handicapped')
      );
      
      const totalParkingSpaces = parkingJson.res.length;
      const normalCount = normalSpaces.length;
      const handicappedCount = handicappedSpaces.length;
      
      const normalParkingBreakdown: { [key: string]: { count: number; elementIds: string[] } } = {};
      const handicappedParkingBreakdown: { [key: string]: { count: number; elementIds: string[] } } = {};
      
      normalSpaces.forEach(space => {
        if (!normalParkingBreakdown[space.name]) {
          normalParkingBreakdown[space.name] = { count: 0, elementIds: [] };
        }
        normalParkingBreakdown[space.name].count++;
        normalParkingBreakdown[space.name].elementIds.push(space.elementID);
      });
      
      handicappedSpaces.forEach(space => {
        if (!handicappedParkingBreakdown[space.name]) {
          handicappedParkingBreakdown[space.name] = { count: 0, elementIds: [] };
        }
        handicappedParkingBreakdown[space.name].count++;
        handicappedParkingBreakdown[space.name].elementIds.push(space.elementID);
      });
      
      let requiredHandicappedSpaces: number;
      
      if (normalCount <= 50) {
        requiredHandicappedSpaces = 1;
      } else if (normalCount <= 100) {
        requiredHandicappedSpaces = 2;
      } else if (normalCount <= 300) {
        requiredHandicappedSpaces = 3;
      } else if (normalCount <= 500) {
        requiredHandicappedSpaces = 4;
      } else {
        const additionalSpaces = normalCount - 500;
        const additionalRequired = Math.ceil(additionalSpaces / 200);
        requiredHandicappedSpaces = 4 + additionalRequired;
      }
      
      const isValidationPassed = handicappedCount >= requiredHandicappedSpaces;
      const shortfall = Math.max(0, requiredHandicappedSpaces - handicappedCount);
      
      let validationMessage: string;
      if (isValidationPassed) {
        validationMessage = `PASSED: ${handicappedCount} handicapped spaces provided (${requiredHandicappedSpaces} required for ${normalCount} normal spaces)`;
      } else {
        validationMessage = `FAILED: Only ${handicappedCount} handicapped spaces provided, but ${requiredHandicappedSpaces} required for ${normalCount} normal spaces. Shortfall: ${shortfall} spaces`;
      }
      
      const parkingAnalysis = {
        totalParkingSpaces,
        normalParkingSpaces: normalCount,
        handicappedParkingSpaces: handicappedCount,
        requiredHandicappedSpaces,
        actualHandicappedSpaces: handicappedCount,
        shortfall,
        isValidationPassed,
        validationMessage
      };
      
      const validationResults: ParkingValidationResult[] = [];
      
      if (!isValidationPassed) {
        const allNormalElementIds = normalSpaces.map(space => space.elementID);
        
        const result: ParkingValidationResult = {
          typeId: "parking_accessibility_validation",
          typeName: "Parking Accessibility Compliance",
          familyName: "Handicapped Parking Requirements",
          widthMm: shortfall, 
          isValid: false,
          elementIds: allNormalElementIds
        };
        
        validationResults.push(result);
      } else {
        const result: ParkingValidationResult = {
          typeId: "parking_accessibility_validation",
          typeName: "Parking Accessibility Compliance",
          familyName: "Handicapped Parking Requirements", 
          widthMm: 0,
          isValid: true,
          elementIds: []
        };
        
        validationResults.push(result);
      }
      
      const failedResults = validationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);
      
      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;
      
      const failureBreakdown: Record<string, number> = {};
      if (!isValidationPassed) {
        Object.keys(normalParkingBreakdown).forEach(spaceName => {
          failureBreakdown[spaceName] = normalParkingBreakdown[spaceName].count;
        });
      }

      const compliancePercent = requiredHandicappedSpaces > 0 
  ? Math.round((handicappedCount / requiredHandicappedSpaces) * 10000) / 100
  : 100;

const handicappedPercentOfTotal = totalParkingSpaces > 0
  ? Math.round((handicappedCount / totalParkingSpaces) * 10000) / 100
  : 100;

      
      const summary = {
        totalTypesChecked: validationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: isValidationPassed ? 1 : 0,
        compliancePercent: compliancePercent, 
        handicappedPercentOfTotal: handicappedPercentOfTotal 
      };

      return {
        validationResults,
        parkingAnalysis,
        normalParkingBreakdown,
        handicappedParkingBreakdown,
        summary,
        failureBreakdown
      };
  
    } catch (error) {
      throw error;
    }
  }

  async getRampInstance(elementGroupId: string, accUserId: string) {
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

    const filter = "property.name.category==Ramps and 'property.name.Element Context'==Instance";
    let cursor: string | null = null;
    const rampWithWidth: Array<{id: string; name: string; elementID: any; width:string }> = [];

    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);

      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const width = el.properties?.results?.find((p: any) => p.name === "Width");
        const elementID = el.properties?.results?.find((p: any) => p.name === "Revit Element ID");
        if (elementID) {
          rampWithWidth.push({
            id: el.id,
            name: el.name,
            elementID: elementID.value,
            width: width?.value
          });
        }
      }

      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);

    return rampWithWidth;
  }


  async executeRule4(elementGroupId: string, accUserId: string) {
    try {
      const instanceData = await this.getRampInstance(elementGroupId, accUserId);
      const instanceLookupMap = new Map<string, typeof instanceData>();

      instanceData.forEach(instance => {
        if (instance.name && instance.id) {
          const key = `${instance.name}|${instance.id}`;
          if (!instanceLookupMap.has(key)) {
            instanceLookupMap.set(key, []);
          }
          instanceLookupMap.get(key)!.push(instance);
        }
      });

      const MIN_WIDTH_MM = 1200;
      const M_TO_MM_MULTIPLIER = 1000;

      let perfectMatches = 0;

      const validationResults = instanceData.map((rampType) => {
        const widthMm = Number(rampType.width) * M_TO_MM_MULTIPLIER;
        const isValid = widthMm >= MIN_WIDTH_MM;

        const result = {
          typeId: rampType.id,
          typeName: rampType.name,
          // elementId: rampType.elementID,
          widthMm: Math.round(widthMm * 100) / 100,
          isValid,
          elementIds: [rampType.elementID]
        };

        if (!isValid) {
          const lookupKey = `${rampType.name}|${rampType.id}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];

          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(instance => instance.elementID);
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(result =>
        result.isValid || (result.elementIds.length > 0)
      );

      const failedResults = filteredValidationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);

      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach(result => {
        failureBreakdown[result.typeName] = result.elementIds.length;
      });

      const summary = {
        totalTypesChecked: validationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches,
        totalInstancesChecked: instanceData.length
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown
      };

    } catch (error) {
      throw error;
    }
  }

  async getStairsInstance(elementGroupId: string, accUserId: string) {
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

    const filter = "property.name.category==Stairs and 'property.name.Element Context'==Instance";
    let cursor: string | null = null;
    const doorsWithWidth: Array<{id: string; name: string; elementID: any; FamilyName:string }> = [];

    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);

      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        const elementID = el.properties?.results?.find((p: any) => p.name === "Revit Element ID");
        if (elementID) {
          doorsWithWidth.push({
            id: el.id,
            name: el.name,
            elementID: elementID.value,
            FamilyName: familyName?.value
          });
        }
      }

      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);

    return doorsWithWidth;
  }

  async getStairsType(elementGroupId: string, accUserId: string) {
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

    const filter = "property.name.category==Stairs and 'property.name.Element Context'==Type";
    let cursor: string | null = null;
    const stairsWithWidth: Array<{id: string; name: string; FamilyName:string; stairsMaxRiserHeight:any }> = [];

    do {
      const resp = await this.queryGraphQL(DOC_QUERY, {
        elementGroupId,
        propertyFilter: filter,
        cursor,
        limit: 500
      }, accUserId);

      const block = resp?.elementsByElementGroup;
      for (const el of block?.results ?? []) {
        const stairsMaxRiserHeight = el.properties?.results?.find((p: any) => p.name === "Maximum Riser Height");
        const familyName = el.properties?.results?.find((p: any) => p.name === "Family Name");
        if (stairsMaxRiserHeight) {
          stairsWithWidth.push({
            id: el.id,
            name: el.name,
            FamilyName: familyName?.value,
            stairsMaxRiserHeight: Math.round(stairsMaxRiserHeight.value * 1000)
          });
        }
      }

      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);

    return stairsWithWidth;
  }

    async getCachedStairsData(elementGroupId: string, accUserId: string): Promise<CachedStairsData> {

    const cacheKey = `Cache Key:GET:/rule-engine/getStairsData/${elementGroupId}?accUserId=${accUserId}`;
    const cachedData = await this.redis.get(cacheKey) as CachedStairsData | null;

    if (cachedData) {
        try {
              const parsedData = JSON.parse(cachedData as unknown as string) as CachedStairsData;
          return parsedData;
        } catch (error) {
          await this.redis.del(cacheKey);
        }
      }
    const res1 = await this.getStairsType(elementGroupId, accUserId);
    const res2 = await this.getStairsInstance(elementGroupId, accUserId);
    const data: CachedStairsData = {res1,res2};
    await this.cacheManager.set(cacheKey, data, 600);
    return data;
  }

  async executeRule5(elementGroupId: string, accUserId: string): Promise<ValidationResponse> {
    try {
      const stairsData = await this.getCachedStairsData(elementGroupId, accUserId);
      const typeData = stairsData.res1;
      const instanceData = stairsData.res2;

      const instanceLookupMap = new Map<string, typeof instanceData>();

      instanceData.forEach(instance => {
        if (instance.name && instance.FamilyName) {
          const key = `${instance.name}|${instance.FamilyName}`;
          if (!instanceLookupMap.has(key)) {
            instanceLookupMap.set(key, []);
          }
          instanceLookupMap.get(key)!.push(instance);
        }
      });

      const MAX_STAIR_RISER_HEIGHT_MM = 175;
      //const M_TO_MM_MULTIPLIER = 1000;

      let perfectMatches = 0;

      const validationResults: ValidationResult[] = typeData.map((stairsType) => {
        const stairRiserHeightMm = stairsType.stairsMaxRiserHeight ;
        const isValid = stairRiserHeightMm <= MAX_STAIR_RISER_HEIGHT_MM;

        const result: ValidationResult = {
          typeId: stairsType.id,
          typeName: stairsType.name,
          familyName: stairsType.FamilyName,
          stairsMaxRiserHeight: Math.round(stairRiserHeightMm * 100) / 100,
          isValid,
          elementIds: []
        };

        if (!isValid) {
          const lookupKey = `${stairsType.name}|${stairsType.FamilyName}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];

          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(instance => instance.elementID);
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(result =>
        result.isValid || (result.elementIds.length > 0)
      );

      const failedResults = filteredValidationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);

      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach(result => {
        failureBreakdown[result.typeName] = result.elementIds.length;
      });

      const summary = {
        totalTypesChecked: validationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches,
        totalInstancesChecked: instanceData.length
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown
      };

    } catch (error) {
      throw error;
    }
  }

}



