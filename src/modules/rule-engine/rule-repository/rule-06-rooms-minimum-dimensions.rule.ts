import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rule6 } from '../../../shared/entities';

@Injectable()
export class Rule06RoomsMinimumDimensionsRule {
  constructor(
    @InjectRepository(Rule6)
    private readonly rule6Repository: Repository<Rule6>,
  ) {}

  async validate(elementGroupId: string, accUserId: string): Promise<any> {
    try {
      // Get all room data for the element group
      const roomData = await this.rule6Repository.find({
        where: { elementGroupId, accUserId },
      });

      if (!roomData || roomData.length === 0) {
        return {
          isValid: false,
          message: 'No room data found for validation',
          details: [],
        };
      }

      const MIN_WIDTH_MM = 2400; // 2.4 meters in mm
      const MIN_LENGTH_MM = 2400; // 2.4 meters in mm
      const M_TO_MM_MULTIPLIER = 1000;

      const validationResults = roomData.map((room) => {
        const area = parseFloat(room.area);
        const perimeter = parseFloat(room.perimeter);

        // Calculate rectangle dimensions from area and perimeter
        const dimensions = this.calculateRectangleDimensions(area, perimeter);

        let isValid = true;
        let failureReasons: string[] = [];
        let lengthMm = 0;
        let widthMm = 0;

        if (!dimensions) {
          isValid = false;
          failureReasons.push(
            'Invalid rectangle dimensions - cannot calculate from area and perimeter',
          );
        } else {
          lengthMm = Math.round(dimensions.length * M_TO_MM_MULTIPLIER * 100) / 100;
          widthMm = Math.round(dimensions.width * M_TO_MM_MULTIPLIER * 100) / 100;

          // Validate width
          if (widthMm < MIN_WIDTH_MM) {
            isValid = false;
            failureReasons.push(
              `Width ${widthMm}mm is less than minimum required ${MIN_WIDTH_MM}mm`,
            );
          }

          // Validate length
          if (lengthMm < MIN_LENGTH_MM) {
            isValid = false;
            failureReasons.push(
              `Length ${lengthMm}mm is less than minimum required ${MIN_LENGTH_MM}mm`,
            );
          }
        }

        return {
          roomId: room.id,
          roomName: room.name,
          familyName: room.familyName,
          area: area,
          perimeter: perimeter,
          lengthMm: lengthMm,
          widthMm: widthMm,
          isValid: isValid,
          failureReasons: failureReasons,
          elementId: room.elementId,
        };
      });

      const validRooms = validationResults.filter((result) => result.isValid);
      const invalidRooms = validationResults.filter((result) => !result.isValid);

      return {
        isValid: invalidRooms.length === 0,
        message: `Validation complete. ${validRooms.length} rooms valid, ${invalidRooms.length} rooms invalid.`,
        totalRooms: roomData.length,
        validRooms: validRooms.length,
        invalidRooms: invalidRooms.length,
        details: validationResults,
        summary: {
          passed: validRooms.length,
          failed: invalidRooms.length,
          total: roomData.length,
        },
      };
    } catch (error) {
      throw new Error(`Rule 6 validation failed: ${error.message}`);
    }
  }

  private calculateRectangleDimensions(area: number, perimeter: number): { length: number; width: number } | null {
    try {
      // For a rectangle: area = length * width, perimeter = 2 * (length + width)
      // From perimeter: length + width = perimeter / 2
      // From area: length * width = area
      
      const halfPerimeter = perimeter / 2;
      
      // Using quadratic formula: x² - (halfPerimeter)x + area = 0
      const discriminant = halfPerimeter * halfPerimeter - 4 * area;
      
      if (discriminant < 0) {
        return null; // No real solution
      }
      
      const sqrtDiscriminant = Math.sqrt(discriminant);
      const length = (halfPerimeter + sqrtDiscriminant) / 2;
      const width = (halfPerimeter - sqrtDiscriminant) / 2;
      
      // Ensure length is always the larger dimension
      if (length < width) {
        return { length: width, width: length };
      }
      
      return { length, width };
    } catch (error) {
      return null;
    }
  }
}
