import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { ApplicationStatus, NotificationKind } from '../common/domain';

@Entity({ name: 'notifications', schema: 'app' })
export class NotificationEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'recipient_id', type: 'text' })
  recipientId: string;

  @Column({ type: 'varchar', length: 32 })
  kind: NotificationKind;

  @Column({ name: 'application_id', type: 'integer' })
  applicationId: number;

  @Column({ name: 'application_title', type: 'text' })
  applicationTitle: string;

  @Column({ name: 'actor_name', type: 'text' })
  actorName: string;

  @Column({ type: 'text', nullable: true })
  text: string | null;

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

  @Column({ type: 'boolean', default: false })
  read: boolean;
}
