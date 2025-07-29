import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult } from './rule.interface';

const RampGradientConfig = {
  ruleId: 'ramp_gradient',
  category: 'Ramps',
  // Table 4 limits: rise not available → assume slope denominator thresholds:
  // For 0–15mm rise: max slope 1:2 → denom ≤2
  // ... >200 mm rise: max slope 1:12 → denom ≤12
  // Here we assume worst-case: allow slopes ≥ 12 (gentlest), ≤2 steepest
  allowedMinDenominator: 2,
  allowedMaxDenominator: 12,
  consistencyTolerancePct: 10 // percent tolerance for consistency
};

@Injectable()
export class RampGradientRule implements IRule {
  ruleId = RampGradientConfig.ruleId;

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    let checked = 0;
    let passedCount = 0;

    const ramps = elements.filter(e => e.category === RampGradientConfig.category);

    for (const e of ramps) {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      const elementContext = elementContextProp ? String(elementContextProp.value) : null;
      
      // Only process elements with "Instance" context
      if (elementContext !== 'Instance') {
        continue;
      }
      
      checked++;
      const slopeProps = e.properties.filter(p => p.name === 'Ramp Max Slope (1/x)');
      const slopeList = slopeProps.map(p => Number(p.value)).filter(v => !isNaN(v));

      let passed = true;
      const issues: string[] = [];

      if (slopeList.length === 0) {
        passed = false;
        issues.push('No slope data available');
      } else {
        // Check each reading against max allowed steepness: denom >= allowedMaxDenominator
        slopeList.forEach(den => {
          if (den < RampGradientConfig.allowedMaxDenominator) {
            passed = false;
            issues.push(`Slope 1:${den} is steeper than allowed 1:${RampGradientConfig.allowedMaxDenominator}`);
          }
        });
        // If multiple readings, check consistency
        if (slopeList.length > 1) {
          const avg = slopeList.reduce((a, b) => a + b, 0) / slopeList.length;
          slopeList.forEach(den => {
            const diffPct = Math.abs(den - avg) / avg * 100;
            if (diffPct > RampGradientConfig.consistencyTolerancePct) {
              passed = false;
              issues.push(`Slope inconsistent: values ${slopeList.join(', ')}`);
            }
          });
        }
      }

      if (passed) passedCount++;

      const revitId = e.properties.find(p => p.name === 'Revit Element ID')?.value || null;
      const ifcGUID = e.properties.find(p => p.name === 'IfcGUID')?.value || null;

      results.push({
        elementId: e.id,
        revitElementId: revitId,
        ifcGUID,
        propertyUsed: 'Ramp Max Slope (1/x)',
        elementContext,
        widthMM: null,
        slopeDenominator: slopeList.length === 1 ? slopeList[0] : null,
        passed,
        message: passed
          ? `Pass — slope(s): ${slopeList.join(', ')} acceptable`
          : `Fail — ${issues.join('; ')}`
      });
    }

    return {
      results,
      summary: {
        totalElementsFound: ramps.length,
        totalElementsChecked: checked,
        totalPassed: passedCount,
        totalFailed: checked - passedCount,
      }
    };
  }
}
