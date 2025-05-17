import { IsOptional } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  role: string;

  @Column({ default: '' })
  @IsOptional()
  pfpUrl?: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @IsOptional()
  customerId?: string;
}
