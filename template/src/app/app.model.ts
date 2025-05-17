import { Link } from 'src/links/link.model';

export function generateMetaTags(link: Link): string {
  let metaTags = '';

  // Basic meta tags
  if (link.title) {
    metaTags += `<meta property="og:title" content="${escapeHtml(link.title)}" />\n`;
    metaTags += `<meta name="twitter:title" content="${escapeHtml(link.title)}" />\n`;
    metaTags += `<title>${escapeHtml(link.title)}</title>\n`;
  }

  if (link.description) {
    metaTags += `<meta name="description" content="${escapeHtml(link.description)}" />\n`;
    metaTags += `<meta property="og:description" content="${escapeHtml(link.description)}" />\n`;
    metaTags += `<meta name="twitter:description" content="${escapeHtml(link.description)}" />\n`;
  }

  if (link.imageUrl) {
    metaTags += `<meta property="og:image" content="${escapeHtml(link.imageUrl)}" />\n`;
    metaTags += `<meta name="twitter:image" content="${escapeHtml(link.imageUrl)}" />\n`;
    metaTags += `<meta name="twitter:card" content="summary_large_image" />\n`;
  } else {
    metaTags += `<meta name="twitter:card" content="summary" />\n`;
  }

  // Add URL meta
  metaTags += `<meta property="og:url" content="${escapeHtml(link.url)}" />\n`;

  // Process additional metadata
  if (link.additionalMetadata) {
    Object.entries(link.additionalMetadata).forEach(([key, value]) => {
      // Skip null or undefined values
      if (value === null || value === undefined) return;

      // Handle common metadata fields with special formatting
      if (key.toLowerCase() === 'type') {
        metaTags += `<meta property="og:type" content="${escapeHtml(String(value))}" />\n`;
      } else if (key.toLowerCase() === 'site_name') {
        metaTags += `<meta property="og:site_name" content="${escapeHtml(String(value))}" />\n`;
      } else if (key.toLowerCase() === 'twitter_site') {
        metaTags += `<meta name="twitter:site" content="${escapeHtml(String(value))}" />\n`;
      } else if (key.toLowerCase() === 'twitter_creator') {
        metaTags += `<meta name="twitter:creator" content="${escapeHtml(String(value))}" />\n`;
      } else {
        // For other custom metadata, use the key as is
        metaTags += `<meta name="${escapeHtml(key)}" content="${escapeHtml(String(value))}" />\n`;
      }
    });
  }

  return metaTags;
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
