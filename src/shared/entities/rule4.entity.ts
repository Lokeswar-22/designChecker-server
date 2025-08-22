import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rule4')
export class Rule4 extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ruleId: string;

  @Column({ type: 'varchar', length: 255 })
  elementGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  elementId: string;

  @Column({ type: 'varchar', length: 255 })
  accUserId: string;

  @Column({ type: 'varchar', length: 255 })
  elementContext: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  familyName: string;

  @Column({ type: 'varchar', length: 255 })
  stairsMaxRiserHeight: string;
}
