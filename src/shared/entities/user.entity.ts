import { Exclude } from 'class-transformer';
import {
  BaseEntity as TypeOrmBaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { ACCUser } from './acc-user.entity';

@Entity({ name: 'user' })
export class User extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn()
  userID: number;

  @Column({ length: 25 })
  firstName?: string;

  @Column({ length: 25 })
  lastName?: string;

  @Column({ length: 50, nullable: true })
  email?: string;

  @Exclude({ toPlainOnly: true })
  @Column({ length: 255, select: false })
  password?: string;

  @ManyToOne(() => User, (user: User) => user.userID, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @CreateDateColumn({ type: 'datetimeoffset', select: false })
  createdAt: Date;

  @ManyToOne(() => User, (user: User) => user.userID, { nullable: true })
  @JoinColumn({ name: 'modifiedBy' })
  modifiedBy: User;

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true, select: false })
  modifiedAt: Date;

  @Column({ type: 'datetimeoffset', nullable: true, select: false })
  deletedAt: Date;

  @Column({ type: 'bit', nullable: true, default: false })
  isAccSynced: boolean;

  @OneToOne(() => ACCUser, (accUser: ACCUser) => accUser.user, { nullable: true })
  @JoinColumn({ name: 'accUserId' })
  accUser: ACCUser;

}
