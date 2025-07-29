export interface IRule {
  ruleId: string;
  validate(elements: any[]): RuleValidationResult;
}

export interface RuleResult {
  elementId: string;
  revitElementId: string | null;
  ifcGUID: string | null;
  propertyUsed: string | null;
  elementContext: string | null;
  widthMM: number | null;
  passed: boolean;
  message: string;
  slope?: number | null;
  slopeDenominator?: number | null;
  riserCount?: number;
  heightMM?: number | null;
  inferredWidth?: number | null;
  riserHeightMM?: string | null;
  treadDepthMM?: string | null;
}


export interface RuleResultWithSlope extends RuleResult {
  slope: number | null;
}

export interface RampGradientRule extends RuleResult {
  slopeDenominator?: number | null;
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
