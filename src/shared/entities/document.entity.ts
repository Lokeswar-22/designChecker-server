import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  extension: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mimetype: string;

  @Column({ type: 'varchar', length: 255 })
  hubId: string;

  @Column({ type: 'varchar', length: 255 })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  folderId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
