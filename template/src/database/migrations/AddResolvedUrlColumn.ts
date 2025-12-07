import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResolvedUrlColumn implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      await queryRunner.query(`
        ALTER TABLE interactions
        ADD COLUMN IF NOT EXISTS resolved_url VARCHAR(2048);
      `);
    } else {
      // SQLite
      await queryRunner.query(`
        ALTER TABLE interactions
        ADD COLUMN resolved_url VARCHAR(2048);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE interactions
      DROP COLUMN IF EXISTS resolved_url;
    `);
  }
}
