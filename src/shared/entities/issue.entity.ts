import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('acc_issue')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  issueId: string;

  @Column({ nullable: true })
  issueTypeId: string;

  @Column({ nullable: true })
  issueSubtypeId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  status: string;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt: Date;
}
