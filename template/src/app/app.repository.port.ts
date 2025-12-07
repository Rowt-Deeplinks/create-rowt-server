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
    city?: string | null;
    ip?: string | null;
    referer?: string;
    userAgent?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    resolvedUrl?: string;
  }): Promise<void>;
  openAppOnUserDevice(link: LinkEntity, userAgent: string): string;
}
