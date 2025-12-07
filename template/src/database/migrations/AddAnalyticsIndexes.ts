import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // Composite index for project-based time-range queries
      // Critical for analytics queries that filter by project and time
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_link_timestamp
        ON interactions(link_id, timestamp DESC);
      `);

      // Index for UTM campaign filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_campaign
        ON interactions(utm_campaign) WHERE utm_campaign IS NOT NULL;
      `);

      // Index for UTM source filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_source
        ON interactions(utm_source) WHERE utm_source IS NOT NULL;
      `);

      // Index for UTM medium filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_medium
        ON interactions(utm_medium) WHERE utm_medium IS NOT NULL;
      `);

      // Index for geographic filtering (country)
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_country
        ON interactions(country) WHERE country IS NOT NULL;
      `);

      // Index for device filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_device
        ON interactions(device) WHERE device IS NOT NULL;
      `);

      // Index for OS filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_os
        ON interactions(os) WHERE os IS NOT NULL;
      `);

      // Index for browser filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_browser
        ON interactions(browser) WHERE browser IS NOT NULL;
      `);

      // Composite index for unique visitor counting
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_ip_timestamp
        ON interactions(ip, timestamp);
      `);

      // Index on links.project_id for JOIN performance
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_project_id
        ON links(project_id);
      `);
    } else {
      // SQLite indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_link_timestamp
        ON interactions(link_id, timestamp DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_campaign
        ON interactions(utm_campaign);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_source
        ON interactions(utm_source);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_utm_medium
        ON interactions(utm_medium);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_country
        ON interactions(country);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_device
        ON interactions(device);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_os
        ON interactions(os);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_browser
        ON interactions(browser);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_ip_timestamp
        ON interactions(ip, timestamp);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_links_project_id
        ON links(project_id);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all analytics indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_link_timestamp;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_utm_campaign;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_utm_source;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_utm_medium;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_country;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_device;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_os;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_browser;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_ip_timestamp;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_links_project_id;`);
  }
}
