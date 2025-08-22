// import { Injectable } from '@nestjs/common';
// import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
// import {
//   ValidationResponse,
//   ValidationResult,
// } from './../rule-interface/rule.interface';

// @Injectable()
// export class DoorValidationRule {
//   constructor(public accAuthService: ACCAuthService) {}
//   getCachedDoorData() {
//     const res1 = {};
//     const res2 = {};
//     return { res1, res2 };
//   }

//   async executeRule(
//     elementGroupId: string,
//     accUserId: string,
//   ): Promise<ValidationResponse> {
//     try {
//       const doorData = await this.getCachedDoorData();
//       const typeData = doorData.res1;
//       const instanceData = doorData.res2;

//       const instanceLookupMap = new Map<string, typeof instanceData>();

//       instanceData.forEach((instance) => {
//         if (instance.name && instance.FamilyName) {
//           const key = `${instance.name}|${instance.FamilyName}`;
//           if (!instanceLookupMap.has(key)) {
//             instanceLookupMap.set(key, []);
//           }
//           instanceLookupMap.get(key)!.push(instance);
//         }
//       });

//       const MIN_WIDTH_MM = 850;
//       const M_TO_MM_MULTIPLIER = 1000;

//       let perfectMatches = 0;
//       let processedCount = 0;

//       const validationResults: ValidationResult[] = typeData.map((doorType) => {
//         const widthMm = doorType.width * M_TO_MM_MULTIPLIER;
//         const isValid = widthMm >= MIN_WIDTH_MM;

//         const result: ValidationResult = {
//           typeId: doorType.id,
//           typeName: doorType.name,
//           familyName: doorType.FamilyName,
//           widthMm: Math.round(widthMm * 100) / 100,
//           isValid,
//           elementIds: [],
//         };

//         if (!isValid) {
//           processedCount++;

//           const lookupKey = `${doorType.name}|${doorType.FamilyName}`;
//           const matchingInstances = instanceLookupMap.get(lookupKey) || [];

//           if (matchingInstances.length > 0) {
//             result.elementIds = matchingInstances.map(
//               (instance) => instance.elementID,
//             );
//             perfectMatches++;
//           }
//         }

//         return result;
//       });

//       const filteredValidationResults = validationResults.filter(
//         (result) => result.isValid || result.elementIds.length > 0,
//       );

//       const failedResults = filteredValidationResults.filter((r) => !r.isValid);
//       const failedWithElements = failedResults.filter(
//         (r) => r.elementIds.length > 0,
//       );
//       const failedWithoutElements = failedResults.filter(
//         (r) => r.elementIds.length === 0,
//       );
//       const totalFailedElements = failedResults.reduce(
//         (sum, r) => sum + r.elementIds.length,
//         0,
//       );

//       const allElementIds = failedResults.flatMap((r) => r.elementIds);
//       const uniqueElementIds = new Set(allElementIds);
//       const duplicateCount = allElementIds.length - uniqueElementIds.size;

//       const failureBreakdown: Record<string, number> = {};
//       failedWithElements.forEach((result) => {
//         failureBreakdown[result.typeName] = result.elementIds.length;
//       });

//       const summary = {
//         totalTypesChecked: filteredValidationResults.length,
//         failedValidations: failedResults.length,
//         failedWithElementIds: failedWithElements.length,
//         failedWithoutElementIds: failedWithoutElements.length,
//         totalFailedElementInstances: totalFailedElements,
//         uniqueElementIds: uniqueElementIds.size,
//         duplicateElementIds: duplicateCount,
//         perfectMatchesFound: perfectMatches,
//         totalInstancesChecked: instanceData.length,
//       };

//       return {
//         validationResults: filteredValidationResults,
//         summary,
//         failureBreakdown,
//       };
//     } catch (error) {
//       throw error;
//     }
//   }
// }
