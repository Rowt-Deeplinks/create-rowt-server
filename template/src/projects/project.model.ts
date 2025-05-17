export class Project {
  constructor(
    public id: string,
    public apiKey: string,
    public baseUrl: string,
    public fallbackUrl: string,
    public appstoreId: string,
    public playstoreId: string,
    public userId: string,
    public name: string,
  ) {}
}

// Authorization request to check if project is authorized
export interface AuthorizationRequest {
  projectId: string;
  apiKey: string;
}

export interface GetProjectOptions {
  includeLinks?: boolean;
  includeInteractions?: boolean;
  startDate?: Date;
  endDate?: Date;
  getPreviousPeriod?: boolean;
}
