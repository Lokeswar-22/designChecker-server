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
