import { Injectable } from '@nestjs/common';
import { IRule, RuleValidationResult, RuleResult } from './rule.interface';

interface StairTypeInstanceMapping {
  typeInfo: any;
  instances: any[];
}

@Injectable()
export class StairHandrailRule implements IRule {
  ruleId = 'stair_handrail';

  validate(elements: any[]): RuleValidationResult {
    const results: RuleResult[] = [];
    
    // Filter stair elements
    const stairElements = elements.filter(e => 
      e.properties.some(p => p.name === 'Revit Category Type Id' && p.value === 'Stairs')
    );
    
    // Separate Type and Instance elements
    const typeElements = stairElements.filter(e => {
      const elementContextProp = e.properties.find(p => p.name === 'Element Context');
      return elementContextProp?.value === 'Type';
    });
    
    const instanceElements = stairElements.filter(e => {
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
    typeToInstanceMap.forEach((mapping: StairTypeInstanceMapping) => {
      const typeElement = mapping.typeInfo;
      const instances = mapping.instances;

      // Extract validation data from type element
      const risersProperty = typeElement.properties.find((p: any) => p.name === 'Actual Number of Risers');
      const riserHeightProperty = typeElement.properties.find((p: any) => p.name === 'Actual Riser Height');
      const treadDepthProperty = typeElement.properties.find((p: any) => p.name === 'Actual Tread Depth');
      
      const risers = risersProperty ? Number(risersProperty.value) : 0;
      const riserHeight = riserHeightProperty ? Number(riserHeightProperty.value) : 0;
      const treadDepth = treadDepthProperty ? Number(treadDepthProperty.value) : 0;
      
      // Rule applies only for ≥5 risers
      if (risers < 5) {
        return;
      }

      // Convert to mm if values are in meters
      const riserHeightMM = riserHeightProperty?.definition?.units?.name === 'Meters' 
        ? (riserHeight * 1000).toFixed(0) 
        : riserHeight.toFixed(0);
      const treadDepthMM = treadDepthProperty?.definition?.units?.name === 'Meters' 
        ? (treadDepth * 1000).toFixed(0) 
        : treadDepth.toFixed(0);

      // Handrail height not available, so fail generically
      const passed = false;
      const message = `Fail — no handrail height data available (Risers: ${risers})`;

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
          riserCount: risers,
          propertyUsed: 'Riser Height',
          widthMM: null,
          riserHeightMM: riserHeightMM,
          treadDepthMM: treadDepthMM,
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

  private createTypeInstanceMapping(typeElements: any[], instanceElements: any[]): StairTypeInstanceMapping[] {
    const mapping: StairTypeInstanceMapping[] = [];

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
