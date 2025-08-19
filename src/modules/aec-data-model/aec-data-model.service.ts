import { Injectable } from '@nestjs/common';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';
import { RequestService } from 'src/shared/services/request.service';
@Injectable()
export class AecDataModelService {

    private endpoint = 'https://developer.api.autodesk.com/aec/graphql';

    constructor(
        private readonly accAuthService: ACCAuthService,
        private readonly http: HttpService,
        private readonly requestService: RequestService
    ) {}

    private async queryGraphQL(query: string, variables: any = {}, accUserId: string) {
        try {
            const accessToken = await this.accAuthService.getValidAccessToken(accUserId);
            if (!accessToken) throw new UnauthorizedException('Login required');

            const response = await firstValueFrom(
                this.http.post(this.endpoint, {
                    query,
                    variables
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })
            );

            return response.data;
        } catch (error) {
            console.error('GraphQL Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getElementGroupsBasedOnMetadata(accUserId: string) {
        console.log("ddsdsdwwq")

        const query = `
        query elementGroupsByHub(
            $hubId: ID!
            $filter: ElementGroupFilterInput
            $pagination: PaginationInput
        ) {
            elementGroupsByHub(
                hubId: $hubId
                filter: $filter
                pagination: $pagination
            ) {
                pagination {
                    cursor
                }
                results {
                    id
                    name
                    alternativeIdentifiers {
                        fileUrn
                        fileVersionUrn
                    }
                }
            }
        }`;
        const { hubId, filter, pagination } = await this.requestService.getBody();
        const variables = { hubId, filter, pagination };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async getVersionsOfAnElementGroup(accUserId: string) {
        const query = `
        query ($elementGroupId: ID!) {
            elementGroupAtTip(elementGroupId: $elementGroupId) {
                id
                name
                alternativeIdentifiers {
                    fileUrn
                    fileVersionUrn
                }
                versionHistory {
                    versions {
                        results {
                            versionNumber
                            createdOn
                        }
                    }
                }
            }
        }`;
        const { elementGroupId } = await this.requestService.getBody();
        const variables = { elementGroupId };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async getInstancesOfAParticularType(accUserId : string) {
        console.log("ddsdsdasdasd")

        const query = `
        query ($elementGroupId: ID!, $propertyFilter: String!) {
            elementsByElementGroup(
                elementGroupId: $elementGroupId
                filter: { query: $propertyFilter }
                pagination: { limit: 5 }
            ) {
                pagination {
                    cursor
                }
                results {
                    id
                    name
                    properties {
                        results {
                            name
                            value
                        }
                    }
                    referencedBy(name: "Type") {
                        pagination {
                            cursor
                        }
                        results {
                            id
                            name
                            alternativeIdentifiers {
                                externalElementId
                            }
                            properties {
                                results {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }`;
        const { elementGroupId, propertyFilter } = await this.requestService.getBody();
        const variables = { elementGroupId, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async getElementInstancesInACategoryByVersion(accUserId : string) {
        console.log("ddasdasdsdsd")

        const query = `
        query GetWallsElementsByElementGroupIdAtVersion(
            $elementGroupId: ID!,
            $versionNumber: Int!,
            $propertyFilter: String!
        ) {
            elementsByElementGroupAtVersion(
                elementGroupId: $elementGroupId,
                versionNumber: $versionNumber,
                filter: { query: $propertyFilter },
                pagination: { limit: 5 }
            ) {
                pagination {
                    cursor
                }
                results {
                    id
                    name
                    properties {
                        results {
                            name
                            value
                            displayValue
                        }
                    }
                }
            }
        }`;
        const { elementGroupId, versionNumber, propertyFilter } = await this.requestService.getBody();
        const variables = { elementGroupId, versionNumber, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async getProjectElementsWithSpecificProperties(accUserId : string) {
                console.log("ddsdsdww")

        const query = `
        query GetElementsInProject($projectId: ID!, $propertyFilter: String!) {
            elementsByProject(
                projectId: $projectId,
                filter: { query: $propertyFilter }
            ) {
                pagination {
                    cursor
                }
                results {
                    id
                    name
                    properties(
                        includeReferencesProperties: "Type"
                        filter: { names: ["Family Name", "Element Name", "Element Context", "Fire Rating"] }
                    ) {
                        results {
                            name
                            value
                            displayValue
                            definition {
                                units {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }`;
        const { projectId, propertyFilter } = await this.requestService.getBody();
        const variables = { projectId, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async listAllElementsHavingConcreteMaterialInAElementGroup(accUserId : string) {
        console.log("ddsdsd")
        const query = `
        query GetElementsPage(
  $elementGroupId: ID!,
  $propertyFilter: String!,
  $cursor: String,
  $limit: Int = 500
) {
  elementsByElementGroup(
    elementGroupId: $elementGroupId
    filter: { query: $propertyFilter }
    pagination: { cursor: $cursor, limit: $limit }
  ) {
    pagination {
      cursor # pass this into the next request's $cursor
    }
    results {
      id
      name
      # add the fields you really need; fewer fields = faster + fewer point costs
    }
  }
}
`;
        const { elementGroupId, propertyFilter } = await this.requestService.getBody();
        const variables = { elementGroupId, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async listElementInstancesHavingConcreteMaterial(accUserId : string) {
        console.log("ddsdadgsdgsdgsd")

        const query = `
        query GetInstancesOfConcreteMaterial($elementGroupId: ID!, $propertyFilter: String!) {
            elementsByElementGroup(
                elementGroupId: $elementGroupId,
                filter: { query: $propertyFilter },
                pagination: { limit: 20 }
            ) {
                results {
                    id
                    name
                    properties {
                        results {
                            name
                            value
                        }
                    }
                    references {
                        results {
                            name
                            displayValue
                            value {
                                properties {
                                    results {
                                        name
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`;
        const { elementGroupId, propertyFilter } = await this.requestService.getBody();
        const variables = { elementGroupId, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async listElementsHavingConcreteMaterialByUsingReferenceType(accUserId : string) {
        console.log("ddsdadgsddddgsdgsd")

        const query = `
        query GetInstancesOfConcreteMaterial($elementGroupId: ID!, $propertyFilter: String!) {
            elementsByElementGroup(
                elementGroupId: $elementGroupId,
                filter: { query: $propertyFilter },
                pagination: { limit: 20 }
            ) {
                results {
                    id
                    name
                    referencedBy(name: "Type") {
                        results {
                            id
                            name
                            properties {
                                results {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }`;
        const { elementGroupId, propertyFilter } = await this.requestService.getBody();
        const variables = { elementGroupId, propertyFilter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async retrieveDistinctValuesById(accUserId : string) {
        const query = `
        query ($elementGroupId: ID!, $propertyDefinitionId: ID!, $filter: ElementFilterInput) {
            distinctPropertyValuesInElementGroupById(
                elementGroupId: $elementGroupId,
                propertyDefinitionId: $propertyDefinitionId,
                filter: $filter
            ) {
                values(limit: 200) {
                    value
                    count
                }
            }
        }`;
        const { elementGroupId, propertyDefinitionId, filter } = await this.requestService.getBody();
        const variables = { elementGroupId, propertyDefinitionId, filter };
        return this.queryGraphQL(query, variables, accUserId);
    }

    async retrieveDistinctValuesByName(accUserId: string) {
        console.log("ddsdadgsdasdasdasdasdasfvgsdgdfgsdgsd")

        const query = `
        query ($elementGroupId: ID!, $name: String!, $filter: ElementFilterInput, $pagination: PaginationInput) {
            distinctPropertyValuesInElementGroupByName(
                elementGroupId: $elementGroupId,
                name: $name,
                filter: $filter,
                pagination: $pagination
            ) {
                pagination {
                    cursor
                }
                results {
                    definition {
                        id
                    }
                    values(limit: 200) {
                        value
                        count
                    }
                }
            }
        }`;
        const { elementGroupId, name, filter, pagination } = await this.requestService.getBody();
        const variables = { elementGroupId, name, filter, pagination };
        return this.queryGraphQL(query, variables, accUserId);
    }

}
