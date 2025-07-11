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

    @CreateDateColumn({ type: 'datetimeoffset' })
    createdAt: Date;

    @ManyToOne(() => User, (user: User) => user.userID, { nullable: true })
    @JoinColumn({ name: 'modifiedBy' })
    modifiedBy: User;

    @UpdateDateColumn({ type: 'datetimeoffset', nullable: true })
    modifiedAt: Date;

    // @ManyToOne(() => User, (user: User) => user.userID)
    // @JoinColumn({ name: 'deletedAt' })
    // deletedBy: User;

    @Column({ type: 'datetimeoffset', nullable: true })
    deletedAt: Date;

    // getCreatedByName() {
    //   return `${this?.createdBy?.firstName || ''} ${this?.createdBy?.lastName || ''
    //     }`.trim();
    // }

    // getCreatedByObj() {
    //   return {
    //     firstName: this?.createdBy?.firstName || '',
    //     lastName: this?.createdBy?.lastName || '',
    //   };
    // }
    // getUpdatedByName() {
    //   return `${this?.modifiedBy?.firstName || ''} ${this?.modifiedBy?.lastName || ''
    //     }`.trim();
    // }

    // getUpdatedByObj() {
    //   return {
    //     firstName: this?.modifiedBy?.firstName || '',
    //     lastName: this?.modifiedBy?.lastName || '',
    //   };
    // }
  }
