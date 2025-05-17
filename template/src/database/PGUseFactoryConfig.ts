import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/users/user.entity';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { RefreshTokenEntity } from 'src/auth/tokens/entities/refresh-token.entity';
import { BlacklistedTokenEntity } from 'src/auth/tokens/entities/blacklisted-token.entity';
import { createDataSource } from 'src/utils/createDataSource';
import { LinkEntity } from 'src/links/link.entity';
import { InteractionEntity } from 'src/links/interaction.entity';
import { ProjectEntity } from 'src/projects/project.entity';

const PGUseFactoryConfig = async (configService: ConfigService) => {
  const dbUrl = configService.get<string>('DATABASE_URL');
  if (!dbUrl) {
    throw new Error('DATABASE_URL is missing in the environment variables');
  }

  // Add entities here to register them in the DataSource
  const entities: EntityClassOrSchema[] = [
    UserEntity,
    ProjectEntity,
    LinkEntity,
    InteractionEntity,
    RefreshTokenEntity,
    BlacklistedTokenEntity,
  ];

  const dataSource = createDataSource(dbUrl, entities);

  await dataSource.initialize();

  return dataSource.options;
};

export default PGUseFactoryConfig;
