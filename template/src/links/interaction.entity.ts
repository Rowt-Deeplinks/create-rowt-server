import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LinkEntity } from './link.entity';
import { DynamicDBColumn } from 'src/utils/dynamicDBColumn';

@Entity('interactions') // Table name
export class InteractionEntity {
  @PrimaryGeneratedColumn('uuid') // Auto-generate UUID
  id: string;

  // unidirectional many-to-one association with LinkEntity
  @ManyToOne(() => LinkEntity) // Define the relationship
  @JoinColumn({ name: 'link_id' }) // Map to the same column
  link: LinkEntity;

  @Column({ type: 'varchar', length: 2048, nullable: true }) // Optional
  referer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  country?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  device?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  os?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  browser?: string;

  @DynamicDBColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
