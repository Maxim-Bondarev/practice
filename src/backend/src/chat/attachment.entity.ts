import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'chat_attachments', schema: 'app' })
export class ChatAttachmentEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ type: 'text' })
  type: string;

  /** File contents; never selected unless explicitly requested. */
  @Column({ type: 'bytea', select: false })
  data: Buffer;
}
