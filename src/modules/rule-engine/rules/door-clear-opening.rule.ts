import { Injectable } from '@nestjs/common';
import { IRule, RuleResult, RuleValidationResult } from './rule.interface';

@Injectable()
export class DoorClearOpeningRule implements IRule {
  ruleId = DoorClearOpeningConfig.ruleId;
  

  validate(elements: any[]): RuleValidationResult {
    const rawResults: RuleResult[] = [];
  
    elements
      .filter(e => e.category === DoorClearOpeningConfig.category)
      .forEach(e => {
        const revitProp = e.properties.find(p => p.name === 'Revit Element ID');
        const ifcProp = e.properties.find(p => p.name === 'IfcGUID');
        const elementContextProp = e.properties.find(p => p.name === 'Element Context');
        const revitId = revitProp ? String(revitProp.value) : null;
        const ifcGUID = ifcProp ? String(ifcProp.value) : null;
        const elementContext = elementContextProp ? String(elementContextProp.value) : null;
  
        const prop = e.properties.find(p =>
          DoorClearOpeningConfig.propertyAliases.includes(p.name)
        );
        const chosenAlias = prop?.name || null;
        const width = prop ? Number(prop.value) : NaN;
        const widthMM = !isNaN(width)
          ? (prop.definition?.units?.name === 'Meters' ? width * 1000 : width)
          : NaN;
  
        const passed = !isNaN(widthMM) && widthMM >= DoorClearOpeningConfig.minOpening;
  
        const message = passed
          ? `Pass — ${chosenAlias} = ${widthMM.toFixed(2)} mm`
          : isNaN(widthMM)
            ? `Fail — No known width property found among [${DoorClearOpeningConfig.propertyAliases.join(', ')}]`
            : `Fail — ${chosenAlias} = ${widthMM.toFixed(2)} mm < required ${DoorClearOpeningConfig.minOpening} mm`;
  
        rawResults.push({
          elementId: e.id,
          revitElementId: revitId,
          ifcGUID,
          elementContext,
          propertyUsed: chosenAlias,
          widthMM: isNaN(widthMM) ? null : Number(widthMM.toFixed(2)),
          passed,
          message
        });
      });
  
    // Filter only valid "Instance" results and exclude undefined width messages
    const instanceResults = rawResults.filter(
      r =>
        r.elementContext === 'Instance' &&
        !r.message.includes('No known width property')
    );
  
    const totalChecked = instanceResults.length;
    const totalPassed = instanceResults.filter(r => r.passed).length;
    const totalFailed = totalChecked - totalPassed;
  
    return {
      results: instanceResults,
      summary: {
        totalElementsFound: totalChecked,     // only valid Instance elements
        totalElementsChecked: totalChecked,
        totalPassed,
        totalFailed
      }
    };
  }


}


export const DoorClearOpeningConfig = {
  ruleId: 'door_clear_opening',
  category: 'Doors',
  propertyAliases: [
    'Door Opening Width',
    'Clear Opening Width',
    'Width',
    'MF Opening Width',
    'Rough Width',
    'Panel Width'
  ],
  minOpening: 850
};


/*
import { Injectable } from '@nestjs/common';
import { IRule, RuleResult, RuleValidationResult } from './rule.interface';

@Injectable()
export class DoorClearOpeningRule implements IRule {
  ruleId = DoorClearOpeningConfig.ruleId;

  private radiansToDegrees(rad: number): number {
    return rad * 180 / Math.PI;
  }

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    let checked = 0;
    let passedCount = 0;

    elements
      .filter(e => e.category === DoorClearOpeningConfig.category)
      .forEach(e => {
        checked++;
        const propWidth = e.properties.find(p =>
          DoorClearOpeningConfig.propertyAliases.includes(p.name)
        );
        const width = propWidth ? Number(propWidth.value) : NaN;

        const swingProp = e.properties.find(p => p.name === 'Swing Angle');
        const swingDeg = swingProp
          ? this.radiansToDegrees(Number(swingProp.value))
          : NaN;

        const widthPass = !isNaN(width) && width >= DoorClearOpeningConfig.minOpening;
        const swingPass = !isNaN(swingDeg) && swingDeg >= 90;

        const passed = widthPass && swingPass;
        if (passed) passedCount++;

        let message: string;
        if (!widthPass) {
          message = `Fail — Width ${isNaN(width) ? 'N/A' : width + 'mm'} < ${DoorClearOpeningConfig.minOpening}mm`;
        } else if (!swingPass) {
          message = isNaN(swingDeg)
            ? `Fail — Swing Angle not found`
            : `Fail — Swing Angle ${swingDeg.toFixed(1)}° < 90°`;
        } else {
          message = `Pass — ${propWidth.name}=${width}mm, Swing=${swingDeg.toFixed(1)}°`;
        }

        results.push({ elementId: e.elementId, passed, message });
      });

    return {
      results,
      summary: {
        totalElementsFound: elements.length,
        totalElementsChecked: checked,
        totalPassed: passedCount,
        totalFailed: checked - passedCount,
      },
    };
  }
}



export const DoorClearOpeningConfig = {
  ruleId: 'door_clear_opening',
  category: 'Doors',
  propertyAliases: [
    'Door Opening Width',
    'Clear Opening Width',
    'Width',
    'MF Opening Width',
    'Rough Width',
    'Panel Width'
  ],
  minOpening: 850
};


*/