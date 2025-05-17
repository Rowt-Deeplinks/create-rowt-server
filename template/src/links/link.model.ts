export class Link {
  constructor(
    public readonly projectId: string,
    public readonly url: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly imageUrl?: string,
    public readonly fallbackUrlOverride?: string,
    public readonly additionalMetadata?: Record<string, any>,
    public readonly properties?: Record<string, any>,
    public readonly lifetimeClicks?: number,
  ) {}
}

// Generic URL type
export type URL = `${'http' | 'https'}://${string}`;

// Shortcode
export type Shortcode = string;
// Link with shortcode
export type ShortcodeLink = string; //`${'http' | 'https'}://${string}`;
