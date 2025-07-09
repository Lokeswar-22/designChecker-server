import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'aps_user_id', unique: true })
    apsUserId: string;

    @Column({ type: 'text' })
    accessToken: string;

    @Column({ type: 'text' })
    refreshToken: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
