import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rule5')
export class Rule5 extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ruleId: string;

  @Column({ type: 'varchar', length: 255 })
  elementGroupId: string;

  @Column({ type: 'varchar', length: 255 })
  elementId: string;

  @Column({ type: 'varchar', length: 255 })
  elementName: string;

  @Column({ type: 'varchar', length: 255 })
  accUserId: string;

  @Column({ type: 'varchar', length: 255 })
  elementContext: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  familyName: string;

  @Column({ type: 'varchar', length: 255 })
  area: string;

  @Column({ type: 'varchar', length: 255 })
  perimeter: string;

  @Column({ type: 'varchar', length: 255 })
  revitElementId: string;

}
