import { Injectable } from '@nestjs/common';
import { IRule, RuleResult } from './rule.interface';

@Injectable()
export class DoorClearOpeningRule implements IRule {
  ruleId = DoorClearOpeningConfig.ruleId;
  

  validate(elements: any[]): { results: RuleResult[]; summary: any } {
    const results: RuleResult[] = [];
    let elementsChecked = 0;
    let elementsPassed = 0;
  
    elements
      .filter(e => e.category === DoorClearOpeningConfig.category)
      .forEach(e => {
        elementsChecked++;
        const prop = e.properties.find(p =>
          DoorClearOpeningConfig.propertyAliases.includes(p.name),
        );
        const width = prop ? Number(prop.value) : NaN;
        const passed = !isNaN(width) && width >= DoorClearOpeningConfig.minOpening;
  
        if (passed) elementsPassed++;
  
        results.push({
          elementId: e.elementId,
          passed,
          message: passed
            ? `Pass — ${prop?.name || 'Unknown'} = ${width}mm`
            : isNaN(width)
              ? `Fail — No known width property found among [${DoorClearOpeningConfig.propertyAliases.join(', ')}]`
              : `Fail — ${prop?.name} = ${width}mm < required ${DoorClearOpeningConfig.minOpening}mm`
        });
      });
  
    return {
      results,
      summary: {
        totalElementsFound: elements.length,
        totalElementsChecked: elementsChecked,
        totalPassed: elementsPassed,
        totalFailed: elementsChecked - elementsPassed
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