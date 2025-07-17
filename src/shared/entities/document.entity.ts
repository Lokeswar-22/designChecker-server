import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 20 })
  extension: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  mimetype: string;

  @Column({ type: 'nvarchar', length: 255 })
  hubId: string;

  @Column({ type: 'nvarchar', length: 255 })
  projectId: string;

  @Column({ type: 'nvarchar', length: 255 })
  folderId: string;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;
}
