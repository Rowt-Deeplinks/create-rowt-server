import { IsOptional } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DynamicDBColumn } from 'src/utils/dynamicDBColumn';

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

  @DynamicDBColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @DynamicDBColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
