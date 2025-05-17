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

export default RowtConfig;
