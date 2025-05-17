<p align="center">
  <a href="https://app.rowt.app" target="blank"><img src="https://rowt.app/static/rowtfavicon.png" width="120" alt="Rowt Logo" /></a>
</p>

# 🦉Rowt Server

### An Open-Source central server for handling deep links, metadata, and tracking interactions

<p>Rowt is an open source alternative to available deeplinking services. Create links for your mobile app with metadata previews, and track clicks with proper attribution.</p>

<p>This is a self-hosted implementation of our infrastructure</p>

<br>

## Option 1: Use Rowt services

<p>To use our service, install the Rowt SDK and go to account.rowt.app to set up your account. </p>

    npm install rowt-sdk

[View SDK Documentation](https://docs.rowt.app)

<br>

## Option 2: Host your own Rowt Instance

    npx create-rowt-server@latest

<br>

### Connect to Postgres

<p>Rowt requires a Postgres server to run, however no setup is needed. We recommend something like Neon if you're looking to get set up quickly.</p>
<p>Once your database is up, pass your Postgres connection url in .env </p>

    DATABASE_URL='postgresql://username:password@url.of.host/databasename?sslmode=require'

<p>That's all you need to get a server running, All necessary configuration happens in the .env file and portal. There are optional advanced configurations available in rowtconfig.json in the root folder.</p>

<p>The base URL will be automatically derived from window location.</p>

<br>

### In your app:

<p>In the app you're looking to create deeplinks for, provide your base url in the options for the SDK.</p>

    const link = new Rowt({...options, baseUrl: "https://your.domain"})

[Learn more about Rowt's SDK setup](https://docs.rowt.app)
