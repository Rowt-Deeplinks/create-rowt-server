import { Check } from 'typeorm';

/**
 * Safe version of Check decorator that only applies for PostgreSQL
 * For SQLite, this skips the Check constraint
 * and returns a no-op decorator
 */
export function DynamicDBCheck(expression: string) {
  const dbType = process.env.ROWT_DB_TYPE || 'postgres';

  // Only apply Check decorator for PostgreSQL
  if (dbType === 'postgres') {
    return Check(expression);
  }

  // For SQLite, return an empty decorator that does nothing
  return function () {
    // No-op decorator
    return;
  };
}
