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
  city?: string;

  @Column({ type: 'varchar', length: 45, nullable: true }) // IPv4 or IPv6
  ip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  device?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  os?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  browser?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // UTM source
  utmSource?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // UTM medium
  utmMedium?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // UTM campaign
  utmCampaign?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // UTM term
  utmTerm?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // UTM content
  utmContent?: string;

  @DynamicDBColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
