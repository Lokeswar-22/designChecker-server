import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult, RuleResultWithSlope } from './rule.interface';

const RampLandingProxyConfig = {
  ruleId: 'ramp_landing_proxy',
  category: 'Ramps',
  maxSlopeForNoLanding: 25, // i.e. slope denominator ≥ 25 means gradient gentler than or equal 1:25
  minWidth: 1500            // mm
};

@Injectable()
export class RampLandingProxyRule implements IRule {
  ruleId = RampLandingProxyConfig.ruleId;

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResultWithSlope[] = [];
    let checked = 0;
    let passedCount = 0;

    elements.filter(e => e.category === RampLandingProxyConfig.category)
      .forEach(e => {
        const slopeProp = e.properties.find(p => p.name === 'Ramp Max Slope (1/x)');
        const widthProp = e.properties.find(p => p.name === 'Width');
        const elementContextProp = e.properties.find(p => p.name === 'Element Context');
        const elementContext = elementContextProp ? String(elementContextProp.value) : null;
        
        // Only process elements with "Instance" context
        if (elementContext !== 'Instance') {
          return;
        }
        
        checked++;
        const slope = slopeProp ? Number(slopeProp.value) : NaN;
        const width = widthProp ? Number(widthProp.value) : NaN;

        const slopeValid = !isNaN(slope) && slope >= RampLandingProxyConfig.maxSlopeForNoLanding;
        const widthValid = !isNaN(width) && width >= RampLandingProxyConfig.minWidth;
        const passed = slopeValid && widthValid;
        if (passed) passedCount++;

        const revitId = e.properties.find(p => p.name === 'Revit Element ID')?.value || null;
        const ifcGUID = e.properties.find(p => p.name === 'IfcGUID')?.value || null;

        const messageParts: string[] = [];
        if (!slopeValid) messageParts.push(`Ramp slope 1:${slope} too steep (>1:${RampLandingProxyConfig.maxSlopeForNoLanding})`);
        if (!widthValid) messageParts.push(`Width ${width}mm < required ${RampLandingProxyConfig.minWidth}mm`);

        const message = passed
          ? `Pass — slope 1:${slope}, width ${width}mm acceptable`
          : `Fail — ${messageParts.join('; ')}`;

        results.push({
          elementId: e.id,
          revitElementId: revitId,
          ifcGUID,
          propertyUsed: null,
          elementContext,
          slope,
          widthMM: width,
          passed,
          message,
        });
      });

    return {
      results,
      summary: {
        totalElementsFound: elements.filter(e => e.category === RampLandingProxyConfig.category).length,
        totalElementsChecked: checked,
        totalPassed: passedCount,
        totalFailed: checked - passedCount,
      }
    };
  }
}
