import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Rule1, Rule2, Rule3, Rule4, Rule5 } from '../../shared/entities/index';
import { ACCAuthService } from '../acc-auth/acc-auth.service';
import { RuleDataHelperService } from './rule-data.helperService';

@Injectable()
export class RuleDataService {
  constructor(
    private readonly accAuthService: ACCAuthService,
    private readonly entityManager: EntityManager,
    private readonly ruleDataHelperService: RuleDataHelperService,
    @InjectRepository(Rule1)
    private readonly rule1Repository: Repository<Rule1>,
    @InjectRepository(Rule2)
    private readonly rule2Repository: Repository<Rule2>,
    @InjectRepository(Rule3)
    private readonly rule3Repository: Repository<Rule3>,
    @InjectRepository(Rule4)
    private readonly rule4Repository: Repository<Rule4>,
    @InjectRepository(Rule5)
    private readonly rule5Repository: Repository<Rule5>,
  ) {}

  //   async checkRuleData(accUserId: string, elementGroupId: string) {
  //     try {
  //       const validateAccUser =
  //         await this.accAuthService.checkAuthStatus(accUserId);
  //       if (validateAccUser) {
  //         const data1 = await this.rule1Repository.find({
  //           where: { accUserId: accUserId, elementGroupId: elementGroupId },
  //         });
  //         const data2 = await this.rule2Repository.find({
  //           where: { accUserId: accUserId, elementGroupId: elementGroupId },
  //         });
  //         const data3 = await this.rule3Repository.find({
  //           where: { accUserId: accUserId, elementGroupId: elementGroupId },
  //         });
  //         const data4 = await this.rule4Repository.find({
  //           where: { accUserId: accUserId, elementGroupId: elementGroupId },
  //         });
  //         const data5 = await this.rule5Repository.find({
  //           where: { accUserId: accUserId, elementGroupId: elementGroupId },
  //         });

  //         const hasData1 = data1 && data1.length > 0;
  //         const hasData2 = data2 && data2.length > 0;
  //         const hasData3 = data3 && data3.length > 0;
  //         const hasData4 = data4 && data4.length > 0;
  //         const hasData5 = data5 && data5.length > 0;

  //         console.log('hasData1', hasData1);
  //         console.log('hasData2', hasData2);
  //         console.log('hasData3', hasData3);
  //         console.log('hasData4', hasData4);
  //         console.log('hasData5', hasData5);

  //         if (hasData1 && hasData2 && hasData3 && hasData4 && hasData5) {
  //           return { message: 'All rule data already exists' };
  //         }

  //         // const promises: Promise<any>[] = [];

  //         // if (!hasData1) promises.push(this.ruleDataHelperService.rule1(elementGroupId, accUserId));
  //         // if (!hasData2) promises.push(this.ruleDataHelperService.rule2(elementGroupId, accUserId));
  //         // if (!hasData3) promises.push(this.ruleDataHelperService.rule3(elementGroupId, accUserId));
  //         // if (!hasData4) promises.push(this.ruleDataHelperService.rule4(elementGroupId, accUserId));
  //         // if (!hasData5) promises.push(this.ruleDataHelperService.rule5(elementGroupId, accUserId));

  //         // await Promise.all(promises);
  //         // return { message: 'Missing rule data has been saved successfully' };
  //       }
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  async checkRuleData(accUserId: string, elementGroupId: string) {
    try {
      const validateAccUser =
        await this.accAuthService.checkAuthStatus(accUserId);
      if (!validateAccUser) {
        return { message: 'User authentication failed' };
      }

      const [data1, data2, data3, data4, data5] = await Promise.all([
        this.rule1Repository.find({ where: { accUserId, elementGroupId } }),
        this.rule2Repository.find({ where: { accUserId, elementGroupId } }),
        this.rule3Repository.find({ where: { accUserId, elementGroupId } }),
        this.rule4Repository.find({ where: { accUserId, elementGroupId } }),
        this.rule5Repository.find({ where: { accUserId, elementGroupId } }),
      ]);

      const ruleChecks = {
        Rule1: data1 && data1.length > 0,
        Rule2: data2 && data2.length > 0,
        Rule3: data3 && data3.length > 0,
        Rule4: data4 && data4.length > 0,
        Rule5: data5 && data5.length > 0,
      };

      // Collect failed rules
      const failedRules = Object.entries(ruleChecks)
        .filter(([_, hasData]) => !hasData)
        .map(([rule]) => rule);

      if (failedRules.length === 0) {
        return { message: 'All 5 rule data available' };
      } else {
        return { message: `${failedRules.join(', ')} has no data available` };
      }
    } catch (error) {
      throw error;
    }
  }
}
