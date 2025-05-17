import { Injectable, Inject } from '@nestjs/common';
import { AppRepositoryPort } from './app.repository.port';
import { LinkEntity } from 'src/links/link.entity';

@Injectable()
export class AppService {
  constructor(
    @Inject('AppRepository')
    private readonly appRepository: AppRepositoryPort,
  ) {}

  async findLinkByShortCode(shortCode: string): Promise<LinkEntity | null> {
    return this.appRepository.findLinkByShortCode(shortCode);
  }

  async logInteraction(data: {
    shortCode: string;
    country?: string | null;
    referer?: string;
    userAgent?: string;
  }): Promise<void> {
    return this.appRepository.logInteraction(data);
  }

  openAppOnUserDevice(link: LinkEntity, userAgent: string): string {
    return this.appRepository.openAppOnUserDevice(link, userAgent);
  }
}
