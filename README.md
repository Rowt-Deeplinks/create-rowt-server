# create-rowt-server

Create a new Rowt server instance with a single command.

Connect to the API with [rowt-sdk](https://npmjs.com/rowt-sdk) in your app
View analytics using the [rowt-console-sdk](https:/npmjs.com/rowt-console-sdk)

## Quick Start

```bash
npx create-rowt-server my-app
```

Or specify the project name when prompted:

```bash
npx create-rowt-server
```

## What is Rowt?

Rowt is an open-source deeplink server for mobile apps. It handles:

- Deep link routing
- Metadata previews
- Click tracking and analytics
- Multi-platform support (iOS/Android)

## Setup

1. Create your server:

   ```bash
   npx create-rowt-server my-rowt-server
   ```

2. Choose your tenant mode (Single-tenant reccommended)

3. Navigate to your project:

   ```bash
   cd my-rowt-server
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Configure your database:

   - Set up PostgreSQL with the required `generate_uid()` function
   - Update the `DATABASE_URL` in `.env`
     [Postgres Setup Documentation](https://docs.rowt.app/#/self-host/?id=configure-your-database)

6. Start the server:
   ```bash
   npm run build
   npm run start
   ```

## Tenant Modes

- **Single-tenant (Recommended)**: Best for individual apps or companies
- **Multi-tenant**: Best for situations where you have many apps with different managers

## Documentation

For complete setup instructions, API documentation, and guides, visit:

📚 **[https://docs.rowt.app](https://docs.rowt.app)**

## License

MIT
