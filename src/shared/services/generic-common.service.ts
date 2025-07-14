// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import { FindOptions, Repository, getManager, getRepository } from 'typeorm';


// @Injectable()
// export class GenericCommonService {
//   private readonly logger = new Logger(GenericCommonService.name);
//   constructor(
//   ) { }

//   async findOne<T>(
//     entity: { new(): T },
//     whereObj: FindOptions<T>,
//     relations: Array<any> = [],
//     loadRelationIds: boolean = false,
//     throwError: boolean = false,
//     fieldValue: string = '',
//     loadEagerRelations: boolean = false
//   ): Promise<T | null> {
//     try {
//       const repository: Repository<T> = getRepository(entity);
//       let findOneObject = { where: whereObj }
//       if (relations.length > 0)
//         findOneObject['relations'] = relations
//       if (loadRelationIds)
//         findOneObject['loadRelationIds'] = true
//       if (loadEagerRelations)
//         findOneObject['loadEagerRelations'] = true
//       const result = await repository.findOne(findOneObject);
//       if (!result && throwError) {
//         throw new BadRequestException({
//           [fieldValue]: 'Not found',
//         });
//       }
//       return result;
//     } catch (error) {
//       this.logger.error("Error in GenericCommonSrvice findOne common function :::::::", error);
//       throw error;
//     }
//   }

//   async checkFieldValueExist<T>(
//     entity: { new(): T },
//     whereObj: FindOptions<T>,
//     fieldValue: string,
//     errorMessage: string = ''
//   ): Promise<T | null> {
//     try {
//       const repository: Repository<T> = getRepository(entity);
//       const result = await repository.findOne({ where: whereObj });
//       if (result) {
//         throw new BadRequestException({
//           [fieldValue]: errorMessage ? errorMessage : 'Already exists',
//         });
//       }
//       return null;
//     } catch (error) {
//       this.logger.error("Error in GenericCommonSrvice checkFieldValueExist common function :::::::", error);
//       throw error;
//     }
//   }

// }
