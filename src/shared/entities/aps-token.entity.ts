import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('aps_token')
export class APSToken {
    @PrimaryGeneratedColumn()
    apsTokenID: number;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    accUserId: string;

    @Column({ type: 'text', nullable: false })
    accessToken: string;

    @Column({ type: 'text', nullable: false })
    refreshToken: string;

    @Column({ type: 'datetimeoffset', nullable: false })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;

}