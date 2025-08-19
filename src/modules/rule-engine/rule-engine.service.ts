import { Injectable } from '@nestjs/common';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

// Export the interface for use in controller
export interface DoorValidationResult {
  typeId: string;
  typeName: string;
  familyName: string;
  widthMm: number;
  isValid: boolean;
  elementIds: string[];
}

// New interface for the complete response
export interface DoorValidationResponse {
  validationResults: DoorValidationResult[];
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
  failureBreakdown: Record<string, number>; // Door type name → failed instance count
}

@Injectable()
export class RuleEngineService {
  private endpoint1 = 'https://developer.api.autodesk.com/aec/graphql';

  constructor(
    public accAuthService: ACCAuthService,
    private readonly http: HttpService
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
      if (response.data.errors) console.error('GraphQL errors:', response.data.errors);
      const result = response.data.data;
      return result;
    } catch (error) {
      console.error('GraphQL query failed:', error);
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
            name: el.name,                    // Instance name
            elementID: elementID.value, 
            FamilyName: familyName?.value     // Instance family name
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
            name: el.name,                    // Type name
            FamilyName: familyName?.value,    // Type family name
            width: widthProp.value 
          });
        }
      }
  
      cursor = block?.pagination?.cursor ?? null;
    } while (cursor);
  
    return doorsWithWidth;
  }

  async executeRule(elementGroupId: string, accUserId: string): Promise<DoorValidationResponse> {
    try {
      console.log('🔍 Starting door validation process...');
      
      // Fetch both datasets concurrently for better performance
      const [typeData, instanceData] = await Promise.all([
        this.getDoorsType(elementGroupId, accUserId),
        this.getDoorsInstance(elementGroupId, accUserId)
      ]);

      console.log(`📊 Data loaded: ${typeData.length} door types, ${instanceData.length} instances`);
  
      // OPTIMIZATION: Create efficient lookup map for O(1) access
      // Key: "instanceName|instanceFamilyName" -> Array of instances
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

      console.log(`🗂️  Created lookup map with ${instanceLookupMap.size} unique name-family combinations`);
  
      // Validation constants
      const MIN_WIDTH_MM = 850;
      const M_TO_MM_MULTIPLIER = 1000;
  
      // Tracking variables
      let perfectMatches = 0;
      let processedCount = 0;
  
      // OPTIMIZED: Process all validations with efficient lookup
      const validationResults: DoorValidationResult[] = typeData.map((doorType) => {
        // Convert width from meters to millimeters
        const widthMm = doorType.width * M_TO_MM_MULTIPLIER;
        const isValid = widthMm >= MIN_WIDTH_MM;

        const result: DoorValidationResult = {
          typeId: doorType.id,
          typeName: doorType.name,
          familyName: doorType.FamilyName,
          widthMm: Math.round(widthMm * 100) / 100, // Round to 2 decimal places
          isValid,
          elementIds: []
        };

        // ONLY process failed validations
        if (!isValid) {
          processedCount++;
          
          // OPTIMIZED: Single O(1) lookup instead of O(n) filter
          const lookupKey = `${doorType.name}|${doorType.FamilyName}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];
          
          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(instance => instance.elementID);
            perfectMatches++;
            
            // MINIMAL LOGGING: Only log successful matches
            console.log(`✅ Match: "${doorType.name}" -> ${matchingInstances.length} elements`);
          }
          
          // Progress indicator for long operations
          if (processedCount % 10 === 0) {
            console.log(`⏳ Processed ${processedCount} failed door types...`);
          }
        }

        return result;
      });

      console.log('📈 Calculating final statistics...');
  
      // Calculate statistics efficiently
      const failedResults = validationResults.filter(r => !r.isValid);
      const failedWithElements = failedResults.filter(r => r.elementIds.length > 0);
      const failedWithoutElements = failedResults.filter(r => r.elementIds.length === 0);
      const totalFailedElements = failedResults.reduce((sum, r) => sum + r.elementIds.length, 0);
      
      // Check for duplicates
      const allElementIds = failedResults.flatMap(r => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;
      
      // Create failure breakdown efficiently
      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach(result => {
        failureBreakdown[result.typeName] = result.elementIds.length;
      });
      
      // Summary object
      const summary = {
        totalTypesChecked: validationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches
      };
      
      // CONCISE FINAL LOGGING
      console.log('\n🎯 DOOR VALIDATION COMPLETED');
      console.log('=====================================');
      console.log(`Door Width Validation Summary:`, summary);
      
      if (Object.keys(failureBreakdown).length > 0) {
        console.log('\n📊 Top Failed Door Types:');
        console.log('=====================================');
        
        // Show only top 10 to reduce console spam
        const sortedTypes = Object.entries(failureBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        sortedTypes.forEach(([typeName, count]) => {
          console.log(`${typeName}\t${count}`);
        });
        
        if (Object.keys(failureBreakdown).length > 10) {
          console.log(`... and ${Object.keys(failureBreakdown).length - 10} more failed types`);
        }
        
        console.log(`\n📈 SUMMARY STATISTICS:`);
        console.log(`   ├─ Perfect Matches: ${perfectMatches}`);
        console.log(`   ├─ No Matches: ${failedWithoutElements.length}`);
        console.log(`   ├─ Total Failed Elements: ${totalFailedElements}`);
        console.log(`   └─ Duplicate Check: ${duplicateCount === 0 ? '✅ Clean' : `⚠️ ${duplicateCount} duplicates`}`);
      }

      return {
        validationResults,
        summary,
        failureBreakdown
      };
  
    } catch (error) {
      console.error('Door validation failed:', error);
      throw error;
    }
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  // Get only failed validations
  async getFailedDoorValidations(elementGroupId: string, accUserId: string): Promise<DoorValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults.filter(result => !result.isValid);
  }

  // Get only failed validations that have element IDs
  async getFailedDoorValidationsWithElements(elementGroupId: string, accUserId: string): Promise<DoorValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults.filter(result => !result.isValid && result.elementIds.length > 0);
  }
  
  // Get validation summary statistics
  async getDoorValidationSummary(elementGroupId: string, accUserId: string) {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.summary;
  }
  
  // Get failed element IDs only (guaranteed unique)
  async getFailedElementIds(elementGroupId: string, accUserId: string): Promise<string[]> {
    const failedResults = await this.getFailedDoorValidationsWithElements(elementGroupId, accUserId);
    const allElementIds = failedResults.flatMap(result => result.elementIds);
    return [...new Set(allElementIds)];
  }

  // Get door type failure breakdown
  async getFailureBreakdown(elementGroupId: string, accUserId: string): Promise<Record<string, number>> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.failureBreakdown;
  }

  // BACKWARD COMPATIBILITY: Return just validation results (for existing code)
  async executeRuleLegacy(elementGroupId: string, accUserId: string): Promise<DoorValidationResult[]> {
    const response = await this.executeRule(elementGroupId, accUserId);
    return response.validationResults;
  }
}
