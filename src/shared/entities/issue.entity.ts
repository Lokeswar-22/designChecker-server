import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('acc_issue')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  issueId: string;

  @Column()
  issueTypeId: string;

  @Column()
  issueSubtypeId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column()
  description: string;

  @Column()
  status: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
