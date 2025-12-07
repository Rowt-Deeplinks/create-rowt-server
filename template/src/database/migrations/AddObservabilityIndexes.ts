import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddObservabilityIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // Indexes on timestamp/createdAt/updatedAt columns for event queries

      // Users table indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_users_created_at
        ON users(created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_users_updated_at
        ON users(updated_at DESC) WHERE updated_at > created_at;
      `);

      // Projects table indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_created_at
        ON projects(created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at
        ON projects(updated_at DESC) WHERE updated_at > created_at;
      `);

      // Composite index for user-scoped project queries
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_user_created
        ON projects(user_id, created_at DESC);
      `);

      // Links table indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_created_at
        ON links(created_at DESC);
      `);

      // Composite index for project-scoped link queries
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_project_created
        ON links(project_id, created_at DESC);
      `);

      // Interactions timestamp index (if not already exists from analytics)
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_timestamp
        ON interactions(timestamp DESC);
      `);
    } else {
      // SQLite indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_users_created_at
        ON users(created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_users_updated_at
        ON users(updated_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_created_at
        ON projects(created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at
        ON projects(updated_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_user_created
        ON projects(user_id, created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_created_at
        ON links(created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_project_created
        ON links(project_id, created_at DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_timestamp
        ON interactions(timestamp DESC);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all observability indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_updated_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_updated_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_user_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_links_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_links_project_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_timestamp;`);
  }
}
