import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryColumn()
  token: string;

  @Column()
  userEmail: string;

  @Column()
  expiresAt: Date;
}
