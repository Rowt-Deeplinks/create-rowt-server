# Self-Hosting a Rowt Instance

Use the `create-rowt-server` scaffold to get your own instance up and running on your own infrastructure.

## Installation

You can create a new Rowt server with a single command:

```bash
npx create-rowt-server my-app
```

Alternatively, run without specifying the project name and you'll be prompted:

```bash
npx create-rowt-server
```

## Quick Start

1. Create your Rowt server instance:
   ```bash
   npx create-rowt-server my-rowt-server
   ```

2. Choose your tenant mode (Single-tenant recommended for most users)

3. Choose your database preference, PostgreSQL or SQLite (Postgres is recommended for most production cases)

  - NOTE: Your credentials, such as your `ROWT_JWT_SECRET` and `ROWT_ADMIN_PASSWORD` will be generated and shown in the terminal on setup completion, store these securely.

4. Navigate to your project:
   ```bash
   cd my-rowt-server
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

5. Configure your database

`Postgres:` Replace the `ROWT_DATABASE_URL` with your postgres database url.

`SQLite`: A default SQLite database is create at project root, `ROWT_DATABASE_URL` will default to this root path, adjust as needed. 

- When deploying to production, you may want to store your SQLite file in a Docker volume or similar for persistence and backups.

6. Build and start the server:
   ```bash
   npm run build
   npm run start
   ```

7. Your Rowt server is now running at `http://localhost:3000`

## Server Commands

- **Build the server**: `npm run build`
- **Start the server**: `npm run start`
- **Start in development mode**: `npm run start:dev`
- **Start without SSL**: `npm run start:nossl`
- **Format code**: `npm run format`
- **Lint code**: `npm run lint`

## Tenant Modes

Rowt instances can be ran in two tenant modes:

### Single-tenant Mode (Recommended)

Single-tenant mode is ideal for individual apps or companies where only one organization manages all apps/projects. In this mode:

- A single admin account manages all projects
- No user management required
- Unlimited links and analytics - only limited by your own infrastructure
- Simplified setup

This is the recommended mode for most users.

### Multi-tenant Mode

Multi-tenant mode is designed for situations where you need to support multiple organizations or users with their own separate projects. In this mode:

- Multiple user accounts managing separate projects
- User registration and authentication
- Optional Stripe integration for subscription management or to use for example usage gating
- Tier-based limits on links and analytics (with Stripe integration enabled)

Multi-tenant mode is more suitable for agencies serving multiple clients, organizations with many teams managing many apps, and SaaS.

## Database Configuration

Rowt supports both PostgreSQL and SQLite databases.

### PostgreSQL (Recommended for Production)

PostgreSQL is recommended for production deployments due to better performance and scalability. To configure PostgreSQL:

1. Set up a PostgreSQL database (any version 11+)
2. Update your `.env` file with the connection details:

```
ROWT_DATABASE_URL=postgresql://username:password@hostname:5432/dbname
ROWT_DB_TYPE=postgres
ROWT_DB_SSL=true  # Set to false if your database doesn't use SSL
```

Recommendations:
- For cloud deployments: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [RDS](https://aws.amazon.com/rds/)
- For local development: [PostgreSQL](https://www.postgresql.org/download/) or [Postgres.app](https://postgresapp.com/)

### SQLite (Simpler Setup)

SQLite is easier to set up and requires no external database service. We use the sqlite3 package, which supports SQLite v3.31.0+. It's great for development or small-scale deployments:

1. Update your `.env` file:

```
ROWT_DATABASE_URL=sqlite:database.sqlite
ROWT_DB_TYPE=sqlite
```

Notes:
- SQLite stores data in a file on your server
- No additional setup required
- Limited scalability compared to PostgreSQL

## Environment Configuration

The `.env` file contains all necessary configuration. Here's a sample:

```
# Rowt Server Configuration
ROWT_TENANT_MODE=single-tenant

# Database Configuration
ROWT_DATABASE_URL=postgresql://username:password@localhost:5432/rowt
ROWT_DB_TYPE=postgres
ROWT_DB_SSL=true

# Server Configuration
ROWT_JWT_SECRET=your-secure-secret-here
PORT=3000

# Single Tenant Admin (only for single-tenant mode)
ROWT_ADMIN_EMAIL=admin@example.com
ROWT_ADMIN_PASSWORD=your-secure-password
ROWT_ADMIN_UUID=1

# Multi Tenant with Subscriptions (only for multi-tenant mode and Stripe integration)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Configuration with rowtconfig.js

Rowt Server behavior can be customized through the `src/rowtconfig.ts` file. Here are the key configurations:

```javascript
const RowtConfig = {
  // Tenant mode
  tenant_mode: process.env.ROWT_TENANT_MODE || 'single-tenant',

  // Cleanup
  cleanup_cron_expression: '0 2 * * *', // Run at 2 AM every day
  link_expiration_days: 400, // Links older than this will be deleted
  link_extension_days: 32, // Links with interactions within this period will not be deleted
  interaction_expiration_days: 90, // Interactions older than this will be deleted

  // Interaction behavior
  will_track_interactions: true,
  absolute_fallback_url: 'https://notfound.rowt.app',

  // Abuse prevention
  rate_limit_defaults: [
    {
      limit: 30,
      ttl: 60000,
    },
  ], // 30 requests per minute
  max_jsonb_size: 10240, // 10kb

  // Auth
  refreshTokenExpires: '7d',
  accessTokenExpires: '1h',
  passwordRequirements: {
    minLength: 8,
    maxLength: 50,
    requireCapital: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialCharacter: true,
  },

  // Payment and subscription (Multi-tenant only)
  stripe_integration: false,
  tierLimits: {
    links: [50, 2000, 5000, -1], // -1 for unlimited
    interactions: [500, 50000, 175000, -1], // -1 for unlimited
  },
};
```

### Configuration Options

| Option | Description |
|--------|-------------|
| `tenant_mode` | Mode of operation: 'single-tenant' or 'multi-tenant' |
| `cleanup_cron_expression` | Cron expression for automatic data cleanup |
| `link_expiration_days` | Number of days before links are considered expired |
| `link_extension_days` | Recent interactions within this many days prevent link deletion |
| `interaction_expiration_days` | Number of days before interactions are deleted |
| `will_track_interactions` | Enable/disable interaction tracking |
| `absolute_fallback_url` | URL to use when all fallbacks fail |
| `rate_limit_defaults` | Default rate limiting settings |
| `max_jsonb_size` | Maximum size for JSON data in properties/metadata (bytes) |
| `refreshTokenExpires` | JWT refresh token expiration |
| `accessTokenExpires` | JWT access token expiration |
| `passwordRequirements` | Password validation rules |
| `stripe_integration` | Enable/disable Stripe integration (multi-tenant only) |
| `tierLimits` | Link and interaction limits per tier (multi-tenant only) |

## Deploying to Production

### General Considerations

1. **Environment Variables**:
   - Use a secure `ROWT_JWT_SECRET` (at least 32 characters)
   - Set secure admin credentials

2. **Database**:
   - Use PostgreSQL for production deployments
   - Ensure regular backups

3. **Security**:
   - Use HTTPS in production
   - Set up a reverse proxy (Nginx, Apache)
   - Configure appropriate firewalls

## Endpoints and API Reference

[View the official API documentation](https://docs.rowt.app/#/self-host/api-endpoints)



### Deploying with Docker

Create a `Dockerfile` in your Rowt server project:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

Create a `docker-compose.yml` for easier deployment:

```yaml
version: '3'
services:
  rowt-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ROWT_DATABASE_URL=postgresql://username:password@db:5432/rowt
      - ROWT_DB_TYPE=postgres
      - ROWT_DB_SSL=false
      - ROWT_JWT_SECRET=your-secure-secret-here
      - ROWT_TENANT_MODE=single-tenant
      - ROWT_ADMIN_EMAIL=admin@example.com
      - ROWT_ADMIN_PASSWORD=your-secure-password
      - ROWT_ADMIN_UUID=1
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=rowt
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: always

volumes:
  pg_data:
```

### SQLite Production Setup

If you're using SQLite in production, ensure data persistence:

1. Store the SQLite file in a dedicated volume:

```yaml
volumes:
  - ./data:/app/data
```

2. Update your `.env` file:

```
ROWT_DATABASE_URL=sqlite:/app/data/database.sqlite
ROWT_DB_TYPE=sqlite
```

3. Set up regular backups:

```bash
# Example backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp /path/to/data/database.sqlite /path/to/backups/database_$DATE.sqlite
```

### Deploying to Cloud Platforms

#### Heroku

1. Create a `Procfile`:

```
web: npm run start
```

2. Configure environment variables in Heroku dashboard
3. Add a PostgreSQL add-on

#### Render

1. Select "Web Service" from the dashboard
2. Connect your repository
3. Configure build settings:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
4. Add environment variables in the dashboard

#### Railway

1. Import your GitHub repository
2. Add a PostgreSQL plugin
3. Configure environment variables
4. Deploy

## Integrating with Your Apps

### Client SDKs

Rowt provides SDKs for easy integration with your applications:

- [rowt-sdk](https://npmjs.com/rowt-sdk) - For client applications
[Jump to rowt-sdk Documentation](/app-sdk/?id=overview)
- [rowt-console-sdk](https://npmjs.com/rowt-console-sdk) - For admin consoles
[Jump to rowt-console-sdk Documentation](/console-sdk/?id=overview)

## Troubleshooting

### Common Issues

#### Database Connection Problems

- Ensure your database credentials are correct
- Check if the database server is accessible
- For PostgreSQL, verify SSL settings

#### Link Creation Errors

- Verify your project ID and API key
- Check URL format
- Ensure metadata doesn't exceed size limits

#### Redirections Not Working

- Verify app schemes are correctly configured
- Check fallback URLs
- Ensure device detection is working properly
- If running local development with Expo, make sure to build the app and test again. Your app's uri scheme is not detected when hosted on an expo server


## Contributing

Rowt is open-source, we're currently setting up a pipeline for issues and contributions. Feel free to reach out to me on [Bluesky](https://bsky.app/profile/chrismccully.com) if you're interested in the project, I'll be updating this readme once everything is set up.


## License

Rowt Server is released under the MIT License. See the LICENSE file for details.