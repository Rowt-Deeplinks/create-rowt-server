import { Column, ColumnOptions } from 'typeorm';

/**
 * Checks if an object is empty (has no own properties)
 */
function isEmptyObject(obj: any): boolean {
  return (
    obj !== null && typeof obj === 'object' && Object.keys(obj).length === 0
  );
}

/**
 * Database-specific column type mapping
 * This allows entities to work with both PostgreSQL and SQLite
 */
export function DynamicDBColumn(options: ColumnOptions): PropertyDecorator {
  // Handle database-specific type mappings
  const dbType = process.env.ROWT_DB_TYPE || 'postgres';

  if (dbType === 'sqlite') {
    // SQLite specific adaptations

    // Change timestamp to datetime
    if (options.type === 'timestamp') {
      options.type = 'datetime';

      // SQLite has different syntax for default timestamps
      if (
        options.default &&
        (options.default === 'CURRENT_TIMESTAMP' ||
          (typeof options.default === 'function' &&
            options.default.toString().includes('CURRENT_TIMESTAMP')))
      ) {
        options.default = "DATETIME('now')";
      }
    }

    // Change jsonb to simple-json
    if (options.type === 'jsonb') {
      options.type = 'simple-json';

      // SQLite requires constant default values
      // Convert object defaults to string JSON representation
      if (options.default !== undefined) {
        if (isEmptyObject(options.default)) {
          // For empty objects, use string representation
          options.default = '{}';
        } else if (typeof options.default === 'object') {
          // For other objects, use JSON stringified version
          options.default = JSON.stringify(options.default);
        }
      }
    }
  }

  // Return the Column decorator with the updated options
  return Column(options);
}
