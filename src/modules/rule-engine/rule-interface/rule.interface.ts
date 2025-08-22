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
  res1: Array<{ id: string; name: string; FamilyName: string; width: any }>;
  res2: Array<{ id: string; name: string; elementID: any; FamilyName: string }>;
}
