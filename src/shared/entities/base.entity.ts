import {
    Column,
    JoinColumn,
    ManyToOne,
    BaseEntity as TypeOrmBaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';

  export class BaseEntity extends TypeOrmBaseEntity {
    @ManyToOne(() => User, (user: User) => user.userID, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User, (user: User) => user.userID, { nullable: true })
    @JoinColumn({ name: 'modifiedBy' })
    modifiedBy: User;

    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    modifiedAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    deletedAt: Date;
  }
