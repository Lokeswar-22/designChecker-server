import { Injectable } from '@nestjs/common';
import { IRule, RuleResult, RuleValidationResult } from './rule.interface';

// Add interface definitions for better type safety
interface DoorTypeInstanceMapping {
  typeInfo: any;
  instances: any[];
}

@Injectable()
export class DoorClearOpeningRule implements IRule {
  ruleId = DoorClearOpeningConfig.ruleId;

  validate(elements: any[]): RuleValidationResult {
    const rawResults: RuleResult[] = [];
    
    // Filter door elements
    const doorElements = elements.filter(e => e.category === DoorClearOpeningConfig.category);
    
    // Separate Type and Instance elements
    const typeElements = doorElements.filter(e => {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      return elementContextProp?.value === 'Type';
    });
    
    const instanceElements = doorElements.filter(e => {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      return elementContextProp?.value === 'Instance';
    });

    // Create Type-to-Instance mapping
    const typeToInstanceMap = this.createTypeInstanceMapping(typeElements, instanceElements);

    // Validate on Type elements and create results for Instance elements
    typeToInstanceMap.forEach((mapping: DoorTypeInstanceMapping) => {
      const typeElement = mapping.typeInfo;
      const instances = mapping.instances;

      // Extract type element properties
      const typeProp = typeElement.properties.find((p: any) =>
        DoorClearOpeningConfig.propertyAliases.includes(p.name)
      );
      const chosenAlias = typeProp?.name || null;
      const width = typeProp ? Number(typeProp.value) : NaN;
      const widthMM = !isNaN(width)
        ? (typeProp.definition?.units?.name === 'Meters' ? width * 1000 : width)
        : NaN;

      // Perform validation on type width
      const passed = !isNaN(widthMM) && widthMM >= DoorClearOpeningConfig.minOpening;

      const message = passed
        ? `Pass — ${chosenAlias} = ${widthMM.toFixed(2)} mm`
        : isNaN(widthMM)
          ? `Fail — No known width property found among [${DoorClearOpeningConfig.propertyAliases.join(', ')}]`
          : `Fail — ${chosenAlias} = ${widthMM.toFixed(2)} mm < required ${DoorClearOpeningConfig.minOpening} mm`;

      // Create results for each corresponding Instance element
      instances.forEach((instanceElement: any) => {
        const revitProp = instanceElement.properties.find((p: any) => p.name === 'Revit Element ID');
        const ifcProp = instanceElement.properties.find((p: any) => p.name === 'IfcGUID');
        const elementContextProp = instanceElement.properties.find((p: any) => p.name === 'Element Context');
        
        const revitId = revitProp ? String(revitProp.value) : null;
        const ifcGUID = ifcProp ? String(ifcProp.value) : null;
        const elementContext = elementContextProp ? String(elementContextProp.value) : null;

        rawResults.push({
          elementId: instanceElement.id,
          revitElementId: revitId, // Instance Revit Element ID for issue creation
          ifcGUID,
          elementContext,
          propertyUsed: chosenAlias,
          widthMM: isNaN(widthMM) ? null : Number(widthMM.toFixed(2)),
          passed,
          message
        });
      });
    });

    // Filter only valid results and exclude undefined width messages
    const validResults = rawResults.filter(
      r => r.elementContext === 'Instance' && !r.message.includes('No known width property')
    );

    const totalChecked = validResults.length;
    const totalPassed = validResults.filter(r => r.passed).length;
    const totalFailed = totalChecked - totalPassed;

    return {
      results: validResults,
      summary: {
        totalElementsFound: totalChecked,
        totalElementsChecked: totalChecked,
        totalPassed,
        totalFailed
      }
    };
  }

  private createTypeInstanceMapping(typeElements: any[], instanceElements: any[]): DoorTypeInstanceMapping[] {
    const mapping: DoorTypeInstanceMapping[] = [];

    typeElements.forEach(typeElement => {
      // Extract type identifiers
      const typeElementName = typeElement.properties.find((p: any) => p.name === 'Element Name')?.value;
      const typeFamilyName = typeElement.properties.find((p: any) => p.name === 'Family Name')?.value;

      if (!typeElementName || !typeFamilyName) return;

      // Find matching instances
      const matchingInstances = instanceElements.filter(instanceElement => {
        const instanceElementName = instanceElement.properties.find((p: any) => p.name === 'Element Name')?.value;
        const instanceFamilyName = instanceElement.properties.find((p: any) => p.name === 'Family Name')?.value;
        
        return instanceElementName === typeElementName && instanceFamilyName === typeFamilyName;
      });

      if (matchingInstances.length > 0) {
        mapping.push({
          typeInfo: typeElement,
          instances: matchingInstances
        });
      }
    });

    return mapping;
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
