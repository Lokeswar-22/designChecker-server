import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('acc_users')
export class ACCUser extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'acc_user_id', unique: true })
    accUserId: string;

    @Column({name: 'userName', nullable: true})
    accUserName: string;

    @Column({name: 'email', nullable: true})
    accEmail: string;

    @Column({ type: 'text' })
    accessToken: string;

    @Column({ type: 'text' })
    refreshToken: string;

    @Column({ type: 'datetimeoffset' })
    expiresAt: Date;

    @OneToOne(() => User, (user: User) => user.userID, { nullable: true })
    @JoinColumn({ name: 'userID' })
    user: User;

}
