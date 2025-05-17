import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenerateUidFunction implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // PostgreSQL custom uid generation
      await queryRunner.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        
        CREATE OR REPLACE FUNCTION generate_uid(size INT) RETURNS TEXT AS $$
        DECLARE
          characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          bytes BYTEA := gen_random_bytes(size);
          l INT := length(characters);
          i INT := 0;
          output TEXT := '';
        BEGIN
          WHILE i < size LOOP
            output := output || substr(characters, get_byte(bytes, i) % l + 1, 1);
            i := i + 1;
          END LOOP;
          RETURN output;
        END;
        $$ LANGUAGE plpgsql VOLATILE;
      `);
    } else {
      // For SQLite, log a warning, falls back to application level UID generation
      console.warn(`
        SQLite doesn't support stored procedures like PostgreSQL.
        The application will use application-level UID generation for SQLite.
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`DROP FUNCTION IF EXISTS generate_uid(INT);`);
    }
  }
}
