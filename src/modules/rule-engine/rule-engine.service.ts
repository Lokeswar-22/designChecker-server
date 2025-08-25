import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import {
  ParkingValidationResponse,
  ParkingValidationResult,
} from './rule-interface/rule.interface';

@Injectable()
export class RuleEngineService {
  constructor(
    public accAuthService: ACCAuthService,
    private readonly entityManager: EntityManager,
  ) {}

  async getSavedDoorData(
    elementGroupId: string,
    accUserId: string,
  ): Promise<any> {
    const Instancedata = await this.entityManager.query(
      `SELECT * FROM rule1 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Instance'`,
    );
    const Typedata = await this.entityManager.query(
      `SELECT * FROM rule1 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Type' AND width != ''`,
    );
    const data = {
      res1: Typedata,
      res2: Instancedata,
    };
    return data;
  }

  async executeRule(elementGroupId: string, accUserId: string): Promise<any> {
    try {
      const doorData = await this.getSavedDoorData(elementGroupId, accUserId);
      const typeData = doorData.res1;
      const instanceData = doorData.res2;
      console.log('instanceData.length', instanceData.length);
      console.log('typeData.length', typeData.length);
      const instanceLookupMap = new Map<string, typeof instanceData>();

      instanceData.forEach((instance) => {
        if (instance.name && instance.familyName) {
          const key = `${instance.name}|${instance.familyName}`;
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

      const validationResults = typeData.map((doorType) => {
        const widthMm = doorType.width * M_TO_MM_MULTIPLIER;
        const isValid = widthMm >= MIN_WIDTH_MM;

        const result = {
          typeId: doorType.id,
          typeName: doorType.name,
          familyName: doorType.familyName,
          widthMm: Math.round(widthMm * 100) / 100,
          isValid,
          elementIds: [] as string[],
        };

        if (!isValid) {
          processedCount++;

          const lookupKey = `${doorType.name}|${doorType.familyName}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];

          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(
              (instance) => instance.elementId,
            );
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(
        (result) => result.isValid || result.elementIds.length > 0,
      );

      const failedResults = filteredValidationResults.filter((r) => !r.isValid);
      const failedWithElements = failedResults.filter(
        (r) => r.elementIds.length > 0,
      );
      const failedWithoutElements = failedResults.filter(
        (r) => r.elementIds.length === 0,
      );
      const totalFailedElements = failedResults.reduce(
        (sum, r) => sum + r.elementIds.length,
        0,
      );

      const allElementIds = failedResults.flatMap((r) => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach((result) => {
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
        totalInstancesChecked: instanceData.length,
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSavedParkingData(
    elementGroupId: string,
    accUserId: string,
    Level: string,
  ): Promise<any> {
    const parkingInstance = await this.entityManager.query(
      `SELECT * FROM rule2 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Instance' AND LevelName = 'Level : ${Level}'`,
    );
    return parkingInstance;
  }

  async executeRule2(
    elementGroupId: string,
    accUserId: string,
    levelName: string,
  ): Promise<ParkingValidationResponse> {
    try {
      const parkingJson = await this.getSavedParkingData(
        elementGroupId,
        accUserId,
        levelName,
      );

      const handicappedSpaces = parkingJson.filter(
        (parking) =>
          parking.name.toLowerCase().includes('hcp') ||
          parking.name.toLowerCase().includes('handicapped'),
      );

      const normalSpaces = parkingJson.filter(
        (parking) =>
          !parking.name.toLowerCase().includes('hcp') &&
          !parking.name.toLowerCase().includes('handicapped'),
      );

      const totalParkingSpaces = parkingJson.length;
      const normalCount = normalSpaces.length;
      const handicappedCount = handicappedSpaces.length;

      const normalParkingBreakdown: {
        [key: string]: { count: number; elementIds: string[] };
      } = {};
      const handicappedParkingBreakdown: {
        [key: string]: { count: number; elementIds: string[] };
      } = {};

      normalSpaces.forEach((space) => {
        if (!normalParkingBreakdown[space.name]) {
          normalParkingBreakdown[space.name] = { count: 0, elementIds: [] };
        }
        normalParkingBreakdown[space.name].count++;
        normalParkingBreakdown[space.name].elementIds.push(space.elementId);
      });

      handicappedSpaces.forEach((space) => {
        if (!handicappedParkingBreakdown[space.name]) {
          handicappedParkingBreakdown[space.name] = {
            count: 0,
            elementIds: [],
          };
        }
        handicappedParkingBreakdown[space.name].count++;
        handicappedParkingBreakdown[space.name].elementIds.push(
          space.elementId,
        );
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
      const shortfall = Math.max(
        0,
        requiredHandicappedSpaces - handicappedCount,
      );

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
        validationMessage,
      };

      const validationResults: ParkingValidationResult[] = [];

      if (!isValidationPassed) {
        const allNormalElementIds = normalSpaces.map(
          (space) => space.elementId,
        );

        const result: ParkingValidationResult = {
          typeId: 'parking_accessibility_validation',
          typeName: 'Parking Accessibility Compliance',
          familyName: 'Handicapped Parking Requirements',
          widthMm: shortfall,
          isValid: false,
          elementIds: allNormalElementIds,
        };

        validationResults.push(result);
      } else {
        const result: ParkingValidationResult = {
          typeId: 'parking_accessibility_validation',
          typeName: 'Parking Accessibility Compliance',
          familyName: 'Handicapped Parking Requirements',
          widthMm: 0,
          isValid: true,
          elementIds: [],
        };

        validationResults.push(result);
      }

      const failedResults = validationResults.filter((r) => !r.isValid);
      const failedWithElements = failedResults.filter(
        (r) => r.elementIds.length > 0,
      );
      const failedWithoutElements = failedResults.filter(
        (r) => r.elementIds.length === 0,
      );
      const totalFailedElements = failedResults.reduce(
        (sum, r) => sum + r.elementIds.length,
        0,
      );

      const allElementIds = failedResults.flatMap((r) => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      if (!isValidationPassed) {
        Object.keys(normalParkingBreakdown).forEach((spaceName) => {
          failureBreakdown[spaceName] = normalParkingBreakdown[spaceName].count;
        });
      }

      const compliancePercent =
        requiredHandicappedSpaces > 0
          ? Math.round((handicappedCount / requiredHandicappedSpaces) * 10000) /
            100
          : 100;

      const handicappedPercentOfTotal =
        totalParkingSpaces > 0
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
        handicappedPercentOfTotal: handicappedPercentOfTotal,
      };

      return {
        validationResults,
        parkingAnalysis,
        normalParkingBreakdown,
        handicappedParkingBreakdown,
        summary,
        failureBreakdown,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRampInstance(elementGroupId: string, accUserId: string) {
    const rampInstance = await this.entityManager.query(
      `SELECT * FROM rule3 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Instance'`,
    );
    return rampInstance;
  }

  async executeRule3(elementGroupId: string, accUserId: string) {
    try {
      const instanceData = await this.getRampInstance(
        elementGroupId,
        accUserId,
      );
      const instanceLookupMap = new Map<string, typeof instanceData>();

      instanceData.forEach((instance) => {
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
          elementIds: [rampType.elementId],
        };

        if (!isValid) {
          const lookupKey = `${rampType.name}|${rampType.id}`;
          const matchingInstances = instanceLookupMap.get(lookupKey) || [];

          if (matchingInstances.length > 0) {
            result.elementIds = matchingInstances.map(
              (instance) => instance.elementId,
            );
            perfectMatches++;
          }
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(
        (result) => result.isValid || result.elementIds.length > 0,
      );

      const failedResults = filteredValidationResults.filter((r) => !r.isValid);
      const failedWithElements = failedResults.filter(
        (r) => r.elementIds.length > 0,
      );
      const failedWithoutElements = failedResults.filter(
        (r) => r.elementIds.length === 0,
      );
      const totalFailedElements = failedResults.reduce(
        (sum, r) => sum + r.elementIds.length,
        0,
      );

      const allElementIds = failedResults.flatMap((r) => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach((result) => {
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
        totalInstancesChecked: instanceData.length,
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSavedStairsData(
    elementGroupId: string,
    accUserId: string,
  ): Promise<any> {
    // const stairsTypeData = await this.entityManager.query(
    //   `SELECT * FROM rule4 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Type'`,
    // );
    const stairsInstanceData = await this.entityManager.query(
      `SELECT * FROM rule4 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Instance'`,
    );
    return { res1: stairsInstanceData };
  }

  async executeRule4(elementGroupId: string, accUserId: string): Promise<any> {
    try {
      const stairsData = await this.getSavedStairsData(
        elementGroupId,
        accUserId,
      );
      const instanceData = stairsData.res1;

      // console.dir(instanceData, { depth: null });

      // const instanceLookupMap = new Map<string, typeof instanceData>();

      // instanceData.forEach((instance) => {
      //   if (instance.name && instance.familyName) {
      //     const key = `${instance.name}|${instance.familyName}`;
      //     if (!instanceLookupMap.has(key)) {
      //       instanceLookupMap.set(key, []);
      //     }
      //     instanceLookupMap.get(key)!.push(instance);
      //   }
      // });

      const MAX_STAIR_RISER_HEIGHT_MM = 175;
      // const M_TO_MM_MULTIPLIER = 1000;

      let perfectMatches = 0;

      const validationResults = instanceData.map((stairsType) => {
        const stairRiserHeightMm = Math.round(
          stairsType.stairsMaxRiserHeight * 1000,
        );

        const isValid =
          stairRiserHeightMm != 0 &&
          stairRiserHeightMm <= MAX_STAIR_RISER_HEIGHT_MM;

        const elementIds =
          !isValid && stairsType.elementId ? [stairsType.elementId] : [];

        const result = {
          typeId: stairsType.id,
          typeName: stairsType.name,
          familyName: stairsType.familyName,
          stairsMaxRiserHeight: Math.round(stairRiserHeightMm * 100) / 100,
          isValid,
          elementIds,
        };

        // if (!isValid) {
        // const lookupKey = `${stairsType.name}|${stairsType.familyName}`;
        // const matchingInstances = instanceLookupMap.get(lookupKey) || [];

        //   // if (matchingInstances.length > 0) {
        //   result.elementIds = matchingInstances.map(
        //     (instance) => instance.elementId,
        //   );
        //   perfectMatches++;
        //   // }
        // }

        return result;
      });

      const filteredValidationResults = validationResults.filter(
        (result) => result.isValid || result.elementIds.length > 0,
      );

      const failedResults = filteredValidationResults.filter((r) => !r.isValid);
      const failedWithElements = failedResults.filter(
        (r) => r.elementIds.length > 0,
      );
      const failedWithoutElements = failedResults.filter(
        (r) => r.elementIds.length === 0,
      );
      const totalFailedElements = failedResults.reduce(
        (sum, r) => sum + r.elementIds.length,
        0,
      );

      const allElementIds = failedResults.flatMap((r) => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach((result) => {
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
        totalInstancesChecked: instanceData.length,
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSavedRoomsData(
    elementGroupId: string,
    accUserId: string,
  ): Promise<any> {
    const roomInstance = await this.entityManager.query(
      `SELECT * FROM rule5 WHERE accUserId = '${accUserId}' AND elementGroupId = '${elementGroupId}' AND elementContext = 'Instance' AND area != '' AND perimeter != ''`,
    );
    return roomInstance;
  }

  async executeRule5(elementGroupId: string, accUserId: string): Promise<any> {
    try {
      const instanceData = await this.getSavedRoomsData(
        elementGroupId,
        accUserId,
      );

      const calculateRectangleDimensions = (
        area: number,
        perimeter: number,
      ): { length: number; width: number } | null => {
        try {
          const halfPerimeter = perimeter / 2;
          const discriminant = Math.pow(halfPerimeter, 2) - 4 * area;

          if (discriminant < 0) {
            return null; // Invalid rectangle
          }

          const sqrtDiscriminant = Math.sqrt(discriminant);
          const dim1 = (halfPerimeter + sqrtDiscriminant) / 2;
          const dim2 = (halfPerimeter - sqrtDiscriminant) / 2;

          // Return length (larger) and width (smaller)
          return {
            length: Math.max(dim1, dim2),
            width: Math.min(dim1, dim2),
          };
        } catch (error) {
          return null;
        }
      };

      const MIN_WIDTH_MM = 1200;
      const MIN_LENGTH_MM = 1500;
      const M_TO_MM_MULTIPLIER = 1000;

      let perfectMatches = 0;
      let processedCount = 0;

      const validationResults: any[] = instanceData.map((roomInstance) => {
        const area = parseFloat(roomInstance.area);
        const perimeter = parseFloat(roomInstance.perimeter);

        // Calculate rectangle dimensions
        const dimensions = calculateRectangleDimensions(area, perimeter);

        let isValid = true;
        let failureReasons: string[] = [];
        let lengthMm = 0;
        let widthMm = 0;

        if (!dimensions) {
          isValid = false;
          failureReasons.push(
            'Invalid rectangle dimensions - cannot calculate from area and perimeter',
          );
        } else {
          lengthMm =
            Math.round(dimensions.length * M_TO_MM_MULTIPLIER * 100) / 100;
          widthMm =
            Math.round(dimensions.width * M_TO_MM_MULTIPLIER * 100) / 100;

          // Validate width
          if (widthMm < MIN_WIDTH_MM) {
            isValid = false;
            failureReasons.push(
              `Width ${widthMm}mm is less than minimum required ${MIN_WIDTH_MM}mm`,
            );
          }

          // Validate length
          if (lengthMm < MIN_LENGTH_MM) {
            isValid = false;
            failureReasons.push(
              `Length ${lengthMm}mm is less than minimum required ${MIN_LENGTH_MM}mm`,
            );
          }
        }

        const result = {
          instanceId: roomInstance.id,
          instanceName: roomInstance.name,
          // FIXED: Use correct property name (camelCase)
          familyName: roomInstance.familyName,
          area: area,
          perimeter: perimeter,
          lengthMm: lengthMm,
          widthMm: widthMm,
          isValid: isValid,
          failureReasons: failureReasons,
          elementIds: [] as String[],
        };

        if (!isValid) {
          processedCount++;
          // FIXED: Use correct property name (camelCase)
          result.elementIds = [roomInstance.elementId];
          perfectMatches++;
        }

        return result;
      });

      const filteredValidationResults = validationResults.filter(
        (result) => result.isValid || result.elementIds.length > 0,
      );

      const failedResults = filteredValidationResults.filter((r) => !r.isValid);
      const failedWithElements = failedResults.filter(
        (r) => r.elementIds.length > 0,
      );
      const failedWithoutElements = failedResults.filter(
        (r) => r.elementIds.length === 0,
      );
      const totalFailedElements = failedResults.reduce(
        (sum, r) => sum + r.elementIds.length,
        0,
      );

      const allElementIds = failedResults.flatMap((r) => r.elementIds);
      const uniqueElementIds = new Set(allElementIds);
      const duplicateCount = allElementIds.length - uniqueElementIds.size;

      const failureBreakdown: Record<string, number> = {};
      failedWithElements.forEach((result) => {
        failureBreakdown[result.instanceName] = result.elementIds.length;
      });

      const summary = {
        totalInstancesChecked: filteredValidationResults.length,
        failedValidations: failedResults.length,
        failedWithElementIds: failedWithElements.length,
        failedWithoutElementIds: failedWithoutElements.length,
        totalFailedElementInstances: totalFailedElements,
        uniqueElementIds: uniqueElementIds.size,
        duplicateElementIds: duplicateCount,
        perfectMatchesFound: perfectMatches,
        totalInstancesProcessed: instanceData.length,
      };

      return {
        validationResults: filteredValidationResults,
        summary,
        failureBreakdown,
      };
    } catch (error) {
      throw error;
    }
  }
}
