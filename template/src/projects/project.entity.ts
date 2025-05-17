import { LinkEntity } from 'src/links/link.entity';
import { UserEntity } from 'src/users/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', default: () => 'uuid_generate_v4()' })
  apiKey: string;

  @Column()
  baseUrl: string;

  @Column()
  fallbackUrl: string;

  @Column({ nullable: true })
  appstoreId: string;

  @Column({ nullable: true })
  playstoreId: string;

  @Column({ nullable: true })
  iosScheme: string;

  @Column({ nullable: true })
  androidScheme: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity) // Define the relationship
  @JoinColumn({ name: 'user_id' }) // Map to the same column
  user: UserEntity;

  @Column()
  name: string;

  @OneToMany(() => LinkEntity, (link) => link.project) // Define the OneToMany relationship
  links: LinkEntity[]; // Array of links associated with the project
}
