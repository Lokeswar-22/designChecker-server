import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rule3')
export class Rule3 extends BaseEntity {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  width: string;

  @Column({ type: 'varchar', length: 255 })
  accUserId: string;

  @Column({ type: 'varchar', length: 255 })
  elementContext: string;
}
