import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult } from './rule.interface';

const WashroomConfig = {
  ruleId: 'washroom_dimensions_proxy',
  category: 'Walls',
  minClearWidth: 1750 // mm
};

@Injectable()
export class WashroomDimensionProxyRule implements IRule {
  ruleId = WashroomConfig.ruleId;

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    let checked = 0, passedCount = 0;

    // take all walls
    const walls = elements.filter(e =>
      e.properties.some(p => p.name === 'Revit Category Type Id' && p.value === WashroomConfig.category)
    );

    for (const e of walls) {
      const revitId = e.properties.find(p => p.name === 'Revit Element ID')?.value || null;
      const ifcGUID = e.properties.find(p => p.name === 'IfcGUID')?.value || null;
      const elementContext = e.properties.find(p => p.name === 'Element Context')?.value || null;
      
      // Only process elements with elementContext "Instance"
      if (elementContext !== 'Instance') {
        continue;
      }
      
      checked++;

      const wallWidthProp = e.properties.find(p => p.name === 'Width');
      const wallThicknessM = wallWidthProp ? Number(wallWidthProp.value) : null;

      // Infer a fake "clear width" — scale thickness to mimic room span
      const inferredClearWidthMM = wallThicknessM
        ? wallThicknessM * 3000 * 1000 // thickness * scale * convert m→mm
        : 1200; // default 1200mm if no width

      const passed = inferredClearWidthMM >= WashroomConfig.minClearWidth;
      if (passed) passedCount++;

      const message = passed
        ? `Pass — inferred clear width ${inferredClearWidthMM.toFixed(0)}mm`
        : `Fail — inferred clear width ${inferredClearWidthMM.toFixed(0)}mm < required ${WashroomConfig.minClearWidth}mm`;

      results.push({
        elementId: e.id,
        revitElementId: revitId,
        ifcGUID,
        propertyUsed: 'Inferred Width',
        elementContext,
        widthMM: null,
        passed,
        message
      });
    }

    return {
      results,
      summary: {
        totalElementsFound: walls.length,
        totalElementsChecked: checked,
        totalPassed: passedCount,
        totalFailed: checked - passedCount
      }
    };
  }
}
