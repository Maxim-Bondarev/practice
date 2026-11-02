import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { ApplicationStatus, Project } from '../common/domain';

@Entity({ name: 'applications', schema: 'app' })
export class ApplicationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Index()
  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'varchar', length: 32 })
  project: Project;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  status: ApplicationStatus;

  @Index()
  @Column({ name: 'author_id', type: 'text' })
  authorId: string;

  @Column({ name: 'author_name', type: 'text' })
  authorName: string;
}
