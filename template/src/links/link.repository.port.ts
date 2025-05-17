import { LinkEntity } from 'src/links/link.entity';
import { Link, ShortcodeLink } from './link.model';

// Link Repository Port
export interface LinkRepositoryPort {
  createLink(link: Link): Promise<ShortcodeLink>;
  getLinksByProjectId(
    projectId: string,
    includeInteractions?: boolean,
  ): Promise<LinkEntity[]>;
}
