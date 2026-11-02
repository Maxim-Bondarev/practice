import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users', schema: 'app' })
export class UserEntity {
  /** Keycloak `sub`. */
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  username: string;

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({
    name: 'first_seen_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  firstSeenAt: Date;

  @UpdateDateColumn({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;
}
