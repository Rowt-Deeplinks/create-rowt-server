import {
  Controller,
  Get,
  Ip,
  Param,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';
import { AppService } from './app.service';
import { Public } from 'src/auth/public.guard';
import { Throttle } from '@nestjs/throttler';
import { readHtmlFile } from 'src/utils/readHtmlFile';
import { getCountry } from 'src/utils/getCountry';
import { generateMetaTags } from './app.model';
import { CreateLinkDTO } from 'src/links/dto/createLink.dto';
import { logger } from 'src/utils/logger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  @Public()
  @Get() // Base route returns a default help dialog
  getHello(@Res() res: ExpressResponse): void {
    const htmlContent = readHtmlFile('src/pages/help.html');

    // Send the HTML content as the response
    res.send(htmlContent);
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('error')
  getError() {
    return readHtmlFile('src/pages/error.html');
  }

  @Public()
  @Get('link')
  async RejectGet() {
    return readHtmlFile('src/pages/rejectGet.html');
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get(':shortCode') // Main redirection logic to the link
  async getLink(
    @Param('shortCode') shortCode: string,
    @Req() request: ExpressRequest,
    @Ip() clientIp: string,
    @Res() response: ExpressResponse,
  ) {
    try {
      logger.debug('Redirecting to shortcode', { shortCode });
      const link = await this.appService.findLinkByShortCode(shortCode);
      if (!link) {
        logger.warn('Link not found', { shortCode });
        return response.status(307).redirect('/error');
      }
      logger.debug('Link project found', { shortCode, projectId: link.project?.id });

      if (!link.project) {
        logger.error('Link project not found', { shortCode });
        return response.status(307).redirect('/error');
      }

      logger.debug('Request headers', {
        allHeaders: request.headers,
        languageCode: request.headers['accept-language'],
        timezone: request.headers['timezone'],
        xTimezone: request.headers['x-timezone'],
      });

      // Extract country - prioritize Cloudflare header, then fall back to timezone detection
      const cfCountry = request.headers['cf-ipcountry'] as string;
      const timezone =
        request.headers['timezone'] ||
        (request.headers['x-timezone'] as string) ||
        null;
      const languageCode = request.headers['accept-language'] || null;

      let country: string | null = null;
      if (cfCountry && cfCountry !== 'XX') {
        // Cloudflare provides 2-letter country code
        country = cfCountry;
      } else if (timezone || languageCode) {
        // Fall back to timezone-based detection
        country = getCountry(timezone as string, languageCode as string) || null;
      }

      // Extract city from Cloudflare headers
      const city = (request.headers['cf-ipcity'] as string) || null;

      // Extract IP - prioritize Cloudflare's connecting IP, then fall back to direct IP
      const ip =
        (request.headers['cf-connecting-ip'] as string) ||
        (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        (request.headers['x-real-ip'] as string) ||
        clientIp ||
        null;

      // Extract UTM parameters from the request URL
      const url = new URL(request.url, `http://${request.get('host')}`);
      const utmSource = url.searchParams.get('utm_source') || null;
      const utmMedium = url.searchParams.get('utm_medium') || null;
      const utmCampaign = url.searchParams.get('utm_campaign') || null;
      const utmTerm = url.searchParams.get('utm_term') || null;
      const utmContent = url.searchParams.get('utm_content') || null;

      // Determine the resolved URL first
      const finalLink = this.appService.openAppOnUserDevice(
        link,
        request.headers['user-agent'] as string,
      );

      // Send interaction log to database asynchronously to avoid delaying the response
      const referer = (request.headers['referer'] ||
        request.headers['referrer'] ||
        request.headers['origin']) as string | undefined;

      this.appService
        .logInteraction({
          shortCode,
          country,
          city,
          ip,
          referer,
          userAgent: request.headers['user-agent'] as string,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          resolvedUrl: finalLink,
        })
        .catch((err) => logger.error('Error logging interaction', { error: err.message, shortCode }));

      // Detect platform and get appropriate fallback URL
      const userAgent = request.headers['user-agent'] || '';
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);

      // Set up fallback URLs
      const regularFallback =
        link.fallbackUrlOverride || link.project.fallbackUrl || '/error';

      // Determine store URLs if available
      let appStoreUrl: string | null = null;
      let playStoreUrl: string | null = null;

      if (isIOS && link.project.appstoreId) {
        appStoreUrl = `https://apps.apple.com/app/id${this.escapeHtml(link.project.appstoreId)}`;
      }

      if (isAndroid && link.project.playstoreId) {
        playStoreUrl = `https://play.google.com/store/apps/details?id=${this.escapeHtml(link.project.playstoreId)}`;
      }

      // Generate metadata for the link - PROPERLY ESCAPED
      const metadata = {
        title: this.escapeHtml(link.title || 'Redirecting...'),
        description: this.escapeHtml(link.description || ''),
        imageUrl: this.escapeHtml(link.imageUrl || ''),
      };

      // Return a minimalist redirect page with simple automatic fallback
      return response.status(200).set('Content-Type', 'text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="${metadata.title}" />
          <meta property="og:description" content="${metadata.description}" />
          <meta property="og:image" content="${metadata.imageUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${metadata.title}" />
          <meta name="twitter:description" content="${metadata.description}" />
          <meta name="twitter:image" content="${metadata.imageUrl}" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${metadata.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
              color: #333;
              background-color: #f9f9f9;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .loader {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(0,0,0,.1);
              border-radius: 50%;
              border-top-color: #3498db;
              animation: spin 1s ease-in-out infinite;
              margin: 0 auto 20px auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .redirect-message {
              font-size: 18px;
              opacity: 0.7;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader"></div>
            <div class="redirect-message">Redirecting...</div>
          </div>
          
          <script>
            // Variables to track app opening status
            let appOpened = false;
            let pageHidden = false;
            
            // Track page visibility changes
            document.addEventListener('visibilitychange', function() {
              if (document.hidden) {
                pageHidden = true;
                appOpened = true;
              }
            });
            
            // Platform detection
            const isIOS = ${isIOS};
            const isAndroid = ${isAndroid};
            
            // Deep link to try to open the app
            const deepLink = "${this.escapeHtml(finalLink)}";
            
            // Fallback URLs
            const regularFallback = "${this.escapeHtml(regularFallback)}";
            const appStoreUrl = ${appStoreUrl ? '"' + this.escapeHtml(appStoreUrl) + '"' : 'null'};
            const playStoreUrl = ${playStoreUrl ? '"' + this.escapeHtml(playStoreUrl) + '"' : 'null'};
            
            // Try to open the app
            function openApp() {
              window.location.href = deepLink;
            }
            
            // Function to handle fallback based on platform
            function handleFallback() {
              if (!pageHidden) {
                // App didn't open, so use the appropriate fallback
                if (isIOS && appStoreUrl) {
                  // Navigate to App Store if on iOS and app store ID is available
                  window.location.href = appStoreUrl;
                } else if (isAndroid && playStoreUrl) {
                  // Navigate to Play Store if on Android and play store ID is available
                  window.location.href = playStoreUrl;
                } else {
                  // Use regular fallback if no store URL is available
                  window.location.href = regularFallback;
                }
              }
            }
            
            // Open the app immediately
            openApp();
            
            // Set appropriate timeout based on platform
            if (isIOS) {
              setTimeout(handleFallback, 2000);
            } else if (isAndroid) {
              setTimeout(handleFallback, 1500);
            } else {
              setTimeout(handleFallback, 1000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      logger.error('Error in getLink', { error: error.message, shortCode });
      return response.status(307).redirect('/error');
    }
  }
}
