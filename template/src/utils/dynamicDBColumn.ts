import { Column, ColumnOptions } from 'typeorm';

/**
 * Database-specific column type mapping
 * This allows entities to work with both PostgreSQL and SQLite
 */
export function DynamicDBColumn(options: ColumnOptions): PropertyDecorator {
  // Handle database-specific type mappings
  const dbType = process.env.ROWT_DB_TYPE || 'postgres';

  if (options.type === 'timestamp' && dbType === 'sqlite') {
    options.type = 'datetime';
  }

  if (options.type === 'jsonb' && dbType === 'sqlite') {
    options.type = 'simple-json';
  }

  // Return the Column decorator with the updated options
  return Column(options);
}
