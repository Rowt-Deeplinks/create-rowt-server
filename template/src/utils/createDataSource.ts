import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import parsePostgresUrl from 'src/utils/parsePostgresUrl';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export const createDataSource = (
  dbUrl: string,
  entities: EntityClassOrSchema[],
) => {
  const { host, port, username, password, database } = parsePostgresUrl(dbUrl);
  return new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: entities,
    synchronize: true,
    ssl: true,
    namingStrategy: new SnakeNamingStrategy(),
  });
};
