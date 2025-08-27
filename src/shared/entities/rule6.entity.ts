import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rule6')
export class Rule6 extends BaseEntity {
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
