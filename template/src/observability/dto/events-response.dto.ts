export interface EventActor {
  type: 'user' | 'system';
  id?: string;
  email?: string;
}

export interface EventResource {
  type: 'user' | 'project' | 'link' | 'interaction';
  id: string;
  attributes: Record<string, any>;
}

export interface EventDTO {
  id: string;
  type: string;
  timestamp: Date;
  actor: EventActor;
  resource: EventResource;
  metadata?: Record<string, any>;
}

export interface EventsPaginationMetadata {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface EventsResponseDTO {
  events: EventDTO[];
  pagination: EventsPaginationMetadata;
}
