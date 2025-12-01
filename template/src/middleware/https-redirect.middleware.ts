import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip in development or if already HTTPS
    if (process.env.NODE_ENV !== 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }

    // Redirect HTTP to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    return res.redirect(301, httpsUrl);
  }
}
