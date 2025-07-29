import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult } from './rule.interface';

@Injectable()
export class StairHandrailRule implements IRule {
  ruleId = 'stair_handrail';

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    let checked = 0, passedCount = 0;

    elements
      .filter(e => 
        e.properties.some(p => p.name === 'Revit Category Type Id' && p.value === 'Stairs')
      )
      .forEach(e => {
        const risers = Number(e.properties.find(p => p.name === 'Actual Number of Risers')?.value || 0);
        if (risers < 5) return; // Rule applies only for ≥5 risers

        checked++;
        const revitId = e.properties.find(p => p.name === 'Revit Element ID')?.value || null;
        const ifcGUID = e.properties.find(p => p.name === 'IfcGUID')?.value || null;
        const elementContext = e.properties.find(p => p.name === 'Element Context')?.value || null;

        // Handrail height not available, so fail generically
        let passed = false;
        let message = `Fail — no handrail height data available (Risers: ${risers})`;

        // Add contextual info: riser height, tread depth
        const riserHeight = Number(e.properties.find(p => p.name === 'Actual Riser Height')?.value || 0);
        const treadDepth = Number(e.properties.find(p => p.name === 'Actual Tread Depth')?.value || 0);

        results.push({
          elementId: e.id,
          revitElementId: revitId,
          ifcGUID,
          elementContext,
          riserCount: risers,
          propertyUsed: 'Riser Height',
          widthMM: null,
          riserHeightMM: (riserHeight * 1000).toFixed(0),
          treadDepthMM: (treadDepth * 1000).toFixed(0),
          passed,
          message
        });
      });

    const totalPassed = results.filter(r => r.passed).length;
    const totalFailed = results.length - totalPassed;

    return {
      results,
      summary: {
        totalElementsFound: results.length,
        totalElementsChecked: checked,
        totalPassed,
        totalFailed
      }
    };
  }
}
