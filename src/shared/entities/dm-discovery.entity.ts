import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('dm_discovery')
export class DmDiscovery extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'acc_user_id'})
    accUserId: string;

    @Column({ type: 'text'})
    hubId: string;

    @Column({ type: 'text'})
    hubName: string;

    @Column({ type: 'text'})
    projectId: string;

    @Column({ type: 'text'})
    projectName: string;

    @Column({ type: 'text'})
    elementGroupId: string;

    @Column({ type: 'text'})
    elementGroupName: string;

    @Column({ type: 'text'})
    fileUrn: string;

    @Column({ type: 'text'})
    fileVersionUrn: string;

}
