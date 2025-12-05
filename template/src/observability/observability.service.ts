import { Injectable, Inject } from '@nestjs/common';
import { ObservabilityRepositoryPort } from './observability.repository.port';
import { EventsQueryDTO } from './dto/events-query.dto';
import { EventsResponseDTO } from './dto/events-response.dto';

@Injectable()
export class ObservabilityService {
  constructor(
    @Inject(ObservabilityRepositoryPort)
    private readonly observabilityRepository: ObservabilityRepositoryPort,
  ) {}

  async getEvents(query: EventsQueryDTO): Promise<EventsResponseDTO> {
    return this.observabilityRepository.getEvents(query);
  }
}
