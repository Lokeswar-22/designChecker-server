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
  size: number; // in bytes

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  mimetype: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  storageUrn: string; // if you store APS storage URN

  @Column({ type: 'nvarchar', length: 255 })
  hubId: string;

  @Column({ type: 'nvarchar', length: 255 })
  projectId: string;

  @Column({ type: 'nvarchar', length: 'max', transformer: {
    to: (value: string[]) => JSON.stringify(value),
    from: (value: string) => JSON.parse(value || '[]')
  }})
  folderIds: string[]; 

  @Column({ type: 'bit', default: false })
  inAccDocs: boolean; 

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
