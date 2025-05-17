import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
  EntityManager,
} from 'typeorm';
import { InteractionEntity } from './interaction.entity';
import RowtConfig from 'src/rowtconfig';
import { ProjectEntity } from 'src/projects/project.entity';
import { randomUUID } from 'crypto';
import { DynamicDBColumn } from 'src/utils/dynamicDBColumn';
import { DynamicDBCheck } from 'src/utils/dynamicDBDecorator';

@Entity('links') // Table name
@DynamicDBCheck(
  `"additional_metadata" IS NULL OR pg_column_size("additional_metadata") <= ${RowtConfig.max_jsonb_size}`,
)
@DynamicDBCheck(
  `"properties" IS NULL OR pg_column_size("properties") <= ${RowtConfig.max_jsonb_size}`,
)
export class LinkEntity {
  @PrimaryColumn({ type: 'varchar', length: 12 }) // Custom 12-character UID
  id: string;

  // unidirectional many-to-one association with ProjectEntity
  @ManyToOne(() => ProjectEntity) // Many-to-One relationship
  @JoinColumn({ name: 'project_id' }) // Specify the foreign key column name
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 2048, nullable: false }) // NOT NULL
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Optional
  title?: string;

  @Column({ type: 'varchar', length: 512, nullable: true }) // Optional
  description?: string;

  @Column({ type: 'varchar', length: 2048, nullable: true }) // Optional
  imageUrl?: string;

  @Column({ type: 'varchar', length: 2048, nullable: true }) // Optional
  fallbackUrlOverride?: string;

  @DynamicDBColumn({ type: 'jsonb', default: {} }) // JSONB with default value
  additionalMetadata?: Record<string, any>;

  @DynamicDBColumn({ type: 'jsonb', default: {} }) // JSONB with default value
  properties: Record<string, any>;

  @Column({ type: 'int', default: 0 }) // Integer with default value
  lifetimeClicks: number;

  // One-to-Many relationship with InteractionEntity
  @OneToMany(() => InteractionEntity, (interaction) => interaction.link)
  interactions: InteractionEntity[];

  @DynamicDBColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  async generateCustomUid() {
    try {
      // Get the entity manager from the entity instance context
      // This is available during entity lifecycle events
      const entityManager: EntityManager = (this as any).manager;

      // Check if this is PostgreSQL
      if (entityManager.connection.options.type === 'postgres') {
        try {
          // Try to use the PostgreSQL function
          const result = await entityManager.query('SELECT generate_uid(12)');
          this.id = result[0].generate_uid;
          return;
        } catch (err) {
          console.warn(
            'PostgreSQL generate_uid function not available, falling back to application-level generation',
          );
          // Fall through to application-level generation
        }
      }

      // For SQLite or as a fallback
      this.id = randomUUID().replace(/-/g, '').substring(0, 12);
    } catch (error) {
      console.error('Error generating UID, using application fallback:', error);
      this.id = randomUUID().replace(/-/g, '').substring(0, 12);
    }
  }
}
