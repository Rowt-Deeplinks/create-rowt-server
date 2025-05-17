// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import parsePostgresUrl from 'src/utils/parsePostgresUrl';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbUrl = configService.get<string>('ROWT_DATABASE_URL');
  const dbType = configService.get<string>('ROWT_DB_TYPE') || 'postgres';
  const enableSSL = configService.get<string>('ROWT_DB_SSL') !== 'false';

  // SQLite configuration
  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: dbUrl || 'database.sqlite',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: configService.get<string>('NODE_ENV') !== 'production',
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  // PostgreSQL configuration
  if (dbUrl) {
    // Parse PostgreSQL URL
    const { host, port, username, password, database } =
      parsePostgresUrl(dbUrl);
    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: configService.get<string>('NODE_ENV') !== 'production',
      ssl: enableSSL ? { rejectUnauthorized: false } : false,
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  // Default PostgreSQL configuration with individual env variables
  const dbDetails = parsePostgresUrl(
    configService.get<string>('ROWT_DATABASE_URL') || '',
  );
  return {
    type: 'postgres',
    host: dbDetails.host || 'localhost',
    port: parseInt(String(dbDetails.port) || '5432', 10),
    username: dbDetails.username || 'postgres',
    password: dbDetails.password || 'postgres',
    database: dbDetails.database || 'rowt',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    ssl: enableSSL ? { rejectUnauthorized: false } : false,
    namingStrategy: new SnakeNamingStrategy(),
  };
};
