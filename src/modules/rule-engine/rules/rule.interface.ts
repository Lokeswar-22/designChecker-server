export interface IRule {
  ruleId: string;
  validate(elements: any[]): RuleValidationResult;
}

export interface RuleResult {
  elementId: string;
  revitElementId: string | null;
  ifcGUID: string | null;
  propertyUsed: string | null;
  widthMM: number | null;
  passed: boolean;
  message: string;
}

export interface RuleValidationResult {
  results: RuleResult[];
  summary: {
    totalElementsFound: number;
    totalElementsChecked: number;
    totalPassed: number;
    totalFailed: number;
  };
}
