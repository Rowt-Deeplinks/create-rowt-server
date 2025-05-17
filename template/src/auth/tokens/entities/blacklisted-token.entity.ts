import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('blacklisted_tokens')
export class BlacklistedTokenEntity {
  @PrimaryColumn()
  token: string;

  @Column()
  expiresAt: Date;
}
