interface PostgresUrlComponents {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

function parsePostgresUrl(url: string): PostgresUrlComponents {
  const parsedUrl = new URL(url);

  return {
    username: parsedUrl.username,
    password: parsedUrl.password,
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port, 10) || 5432, // Default PostgreSQL port is 5432
    database: parsedUrl.pathname.slice(1), // Remove the leading '/'
  };
}

export default parsePostgresUrl;
