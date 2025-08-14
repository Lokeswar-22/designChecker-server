import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult } from './rule.interface';

interface RampTypeInstanceMapping {
  typeInfo: any;
  instances: any[];
}

@Injectable()
export class RampLandingProxyRule implements IRule {
  ruleId = 'ramp_landing_proxy';

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    
    // Filter ramp elements
    const rampElements = elements.filter(e => 
      e.properties.some(p => p.name === 'Revit Category Type Id' && p.value === 'Ramps')
    );
    
    // Separate Type and Instance elements
    const typeElements = rampElements.filter(e => {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      return elementContextProp?.value === 'Type';
    });
    
    const instanceElements = rampElements.filter(e => {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      return elementContextProp?.value === 'Instance';
    });

    // Check if there are no Instance elements to validate
    if (instanceElements.length === 0) {
      return {
        results: [],
        summary: {
          totalElementsFound: 0,
          totalElementsChecked: 0,
          totalPassed: 0,
          totalFailed: 0,
        }
      };
    }

    // Create Type-to-Instance mapping
    const typeToInstanceMap = this.createTypeInstanceMapping(typeElements, instanceElements);

    // If no valid mappings exist, return no instances message
    if (typeToInstanceMap.length === 0) {
      return {
        results: [],
        summary: {
          totalElementsFound: instanceElements.length,
          totalElementsChecked: 0,
          totalPassed: 0,
          totalFailed: 0,
        }
      };
    }

    // Validate on Type elements and create results for Instance elements
    typeToInstanceMap.forEach((mapping: RampTypeInstanceMapping) => {
      const typeElement = mapping.typeInfo;
      const instances = mapping.instances;

      // Extract validation data from type element
      const widthProperty = typeElement.properties.find((p: any) => p.name === 'Width');
      const width = widthProperty ? Number(widthProperty.value) : 0;

      // Infer landing depth as 120% of width, convert to mm
      const landingDepthMM = width * 1.2 * 1000;
      const requiredDepthMM = 1520;
      const passed = landingDepthMM >= requiredDepthMM;

      // Create message
      const message = passed
        ? `Pass — inferred landing depth ${landingDepthMM.toFixed(0)}mm ≥ required ${requiredDepthMM}mm`
        : `Fail — inferred landing depth ${landingDepthMM.toFixed(0)}mm < required ${requiredDepthMM}mm`;

      // Create results for each corresponding Instance element
      instances.forEach((instanceElement: any) => {
        const revitProp = instanceElement.properties.find((p: any) => p.name === 'Revit Element ID');
        const ifcProp = instanceElement.properties.find((p: any) => p.name === 'IfcGUID');
        const elementContextProp = instanceElement.properties.find((p: any) => p.name === 'Element Context');
        
        const revitId = revitProp ? String(revitProp.value) : null;
        const ifcGUID = ifcProp ? String(ifcProp.value) : null;
        const elementContext = elementContextProp ? String(elementContextProp.value) : null;

        results.push({
          elementId: instanceElement.id,
          revitElementId: revitId,
          ifcGUID,
          elementContext,
          propertyUsed: 'Inferred Landing Depth',
          widthMM: landingDepthMM,
          passed,
          message
        });
      });
    });

    const totalChecked = results.length;
    const totalPassed = results.filter(r => r.passed).length;
    const totalFailed = totalChecked - totalPassed;

    return {
      results,
      summary: {
        totalElementsFound: totalChecked,
        totalElementsChecked: totalChecked,
        totalPassed,
        totalFailed
      }
    };
  }

  private createTypeInstanceMapping(typeElements: any[], instanceElements: any[]): RampTypeInstanceMapping[] {
    const mapping: RampTypeInstanceMapping[] = [];

    typeElements.forEach(typeElement => {
      const typeElementName = typeElement.properties.find((p: any) => p.name === 'Element Name')?.value;
      const typeFamilyName = typeElement.properties.find((p: any) => p.name === 'Family Name')?.value;

      if (!typeElementName || !typeFamilyName) return;

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
