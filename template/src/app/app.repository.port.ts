import { LinkEntity } from 'src/links/link.entity';

// Generic URL type
export type URL = `${'http' | 'https'}://${string}`;

// Shortcode
export type Shortcode = string;

// Link with shortcode
export type ShortcodeLink = string; //`${'http' | 'https'}://${string}`;

// Link Repository Port
export interface AppRepositoryPort {
  findLinkByShortCode(shortCode: string): Promise<LinkEntity | null>;
  logInteraction(data: {
    shortCode: string;
    country?: string | null;
    referer?: string;
    userAgent?: string;
  }): Promise<void>;
  openAppOnUserDevice(link: LinkEntity, userAgent: string): string;
}
