import { EventsQueryDTO } from './dto/events-query.dto';
import { EventsResponseDTO } from './dto/events-response.dto';

export abstract class ObservabilityRepositoryPort {
  abstract getEvents(query: EventsQueryDTO): Promise<EventsResponseDTO>;
}
