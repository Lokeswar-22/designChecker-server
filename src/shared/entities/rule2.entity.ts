import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rule2')
export class Rule2 extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ruleId: string;

  @Column({ type: 'varchar', length: 255 })
  elementGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  elementId: string;

  @Column({ type: 'varchar', length: 255 })
  levelName: string;

  @Column({ type: 'varchar', length: 255 })
  accUserId: string;

  @Column({ type: 'varchar', length: 255 })
  elementContext: string;

}
