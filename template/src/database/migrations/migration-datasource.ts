import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import parsePostgresUrl from 'src/utils/parsePostgresUrl';

// Load environment variables
config();

// Get database configuration from environment
const dbUrl = process.env.ROWT_DATABASE_URL;
const dbType = process.env.ROWT_DB_TYPE || 'postgres';
const enableSSL = process.env.ROWT_DB_SSL !== 'false';

// Define migrations path
const migrationsPath = __dirname + '/../migrations/*.{ts,js}';

// Configure datasource based on database type
let dataSourceOptions: DataSourceOptions;

if (dbType === 'sqlite') {
  dataSourceOptions = {
    type: 'sqlite',
    database: dbUrl || 'database.sqlite',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [migrationsPath],
    namingStrategy: new SnakeNamingStrategy(),
  };
} else {
  // PostgreSQL configuration based on URL
  if (dbUrl) {
    // Parse PostgreSQL URL
    const { host, port, username, password, database } =
      parsePostgresUrl(dbUrl);
    dataSourceOptions = {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [migrationsPath],
      ssl: enableSSL ? { rejectUnauthorized: false } : false,
      namingStrategy: new SnakeNamingStrategy(),
    };
  } else {
    // Fallback to default values if URL is not provided
    const dbDetails = parsePostgresUrl(process.env.ROWT_DATABASE_URL || '');
    dataSourceOptions = {
      type: 'postgres',
      host: dbDetails.host || 'localhost',
      port: parseInt(String(dbDetails.port) || '5432', 10),
      username: dbDetails.username || 'postgres',
      password: dbDetails.password || 'postgres',
      database: dbDetails.database || 'rowt',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [migrationsPath],
      ssl: enableSSL ? { rejectUnauthorized: false } : false,
      namingStrategy: new SnakeNamingStrategy(),
    };
  }
}

export default new DataSource(dataSourceOptions);
