import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { ApplicationStatus } from '../common/domain';

export type ChatItemType = 'message' | 'status';

@Entity({ name: 'chat_items', schema: 'app' })
@Index(['applicationId', 'createdAt'])
export class ChatItemEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ type: 'varchar', length: 16 })
  type: ChatItemType;

  @Column({ name: 'author_id', type: 'text' })
  authorId: string;

  @Column({ name: 'author_name', type: 'text' })
  authorName: string;

  @Column({ name: 'is_admin', type: 'boolean', nullable: true })
  isAdmin: boolean | null;

  @Column({ type: 'text', nullable: true })
  text: string | null;

  @Column({ name: 'attachment_id', type: 'uuid', nullable: true })
  attachmentId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  status: ApplicationStatus | null;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  previousStatus: ApplicationStatus | null;

  @Index()
  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
