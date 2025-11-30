import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { LinkService } from './link.service';
import { CreateLinkDTO } from './dto/createLink.dto';
import { Public } from 'src/auth/public.guard';
import { readHtmlFile } from 'src/utils/readHtmlFile';
import { ProjectService } from 'src/projects/project.service';

@Controller('link')
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly projectService: ProjectService,
  ) {}

  @Public()
  @Get()
  async RejectGet() {
    return readHtmlFile('src/pages/rejectGet.html');
  }

  @Public()
  @Post()
  async AuthenticateAndCreateLink(
    @Body() createLinkRequest: CreateLinkDTO,
    @Req() req: Request,
  ) {
    console.log('Creating link with request: ', createLinkRequest);
    try {
      if (!createLinkRequest) {
        throw new BadRequestException('Invalid request - missing body');
      }

      const authorized = await this.projectService.authorize(
        createLinkRequest.projectId,
        createLinkRequest.apiKey,
      );
      if (!authorized) {
        throw new UnauthorizedException('Invalid API key or project ID');
      }

      if (!createLinkRequest.projectId) {
        throw new BadRequestException('Missing projectId');
      }

      const shortcode = await this.linkService.createLink(createLinkRequest);

      if (!shortcode) {
        throw new BadRequestException('Failed to create link');
      }

      const host = req.headers['host'];

      return `${host.includes('localhost') ? '' : 'https://'}${host}/${shortcode}`;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('byProjectId')
  async getLinksByProjectId(
    @Body() body: { projectId: string; includeInteractions?: boolean },
  ) {
    console.log('Getting links by project id: ', body.projectId);
    try {
      let { projectId, includeInteractions } = body;
      if (
        typeof projectId === 'string' &&
        projectId.startsWith('{') &&
        projectId.endsWith('}')
      ) {
        projectId = JSON.parse(projectId);
      }
      if (!projectId) {
        console.error('Missing projectId');
        throw new BadRequestException('Missing projectId');
      }
      const links = await this.linkService.getLinksByProjectId(
        projectId,
        includeInteractions ? includeInteractions : false,
      );

      console.log('Links found: ', links);

      if (!links) {
        throw new NotFoundException('No links found for this project');
      }

      return links;
    } catch (error) {
      console.error(`Unable to get links from project: ${error.message}`);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Unable to get links from project: ${error.message}`,
      );
    }
  }
}
