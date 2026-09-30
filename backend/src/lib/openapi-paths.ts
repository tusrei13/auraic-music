/**
 * Explicit OpenAPI 3.0 Path definitions for Auraic versioned API (/api/v1).
 * Total documented versioned operations: 37
 */
export const openapiV1Paths: Record<string, any> = {
  // --- 1. Auth (4 endpoints) ---
  '/api/v1/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user account',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } }, required: ['email', 'password'] } } },
      },
      responses: { 201: { description: 'User successfully registered' }, 400: { description: 'Validation error' } },
    },
  },
  '/api/v1/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Authenticate and receive session tokens',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } },
      },
      responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
    },
  },
  '/api/v1/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Retrieve authenticated profile context',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'User profile object' }, 401: { description: 'Unauthorized' } },
    },
  },
  '/api/v1/auth/profile': {
    patch: {
      tags: ['Auth'],
      summary: 'Update authenticated user profile information',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Profile updated' }, 401: { description: 'Unauthorized' } },
    },
  },

  // --- 2. Songs (2 endpoints) ---
  '/api/v1/songs/history': {
    get: {
      tags: ['Songs'],
      summary: 'Fetch personal listening history timeline',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Recent listening history array' } },
    },
  },
  '/api/v1/songs/{id}/listen': {
    post: {
      tags: ['Songs'],
      summary: 'Increment track listen count and append history record',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { 200: { description: 'Listen recorded' } },
    },
  },

  // --- 3. Playlists (7 endpoints) ---
  '/api/v1/playlists': {
    get: {
      tags: ['Playlists'],
      summary: 'List current user playlists',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'User playlists' } },
    },
    post: {
      tags: ['Playlists'],
      summary: 'Create a new user playlist',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Playlist created' } },
    },
  },
  '/api/v1/playlists/{id}': {
    get: {
      tags: ['Playlists'],
      summary: 'Get playlist details with tracks',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Playlist details' } },
    },
    delete: {
      tags: ['Playlists'],
      summary: 'Delete playlist by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Playlist deleted' } },
    },
  },
  '/api/v1/playlists/{id}/songs': {
    post: {
      tags: ['Playlists'],
      summary: 'Add a track to playlist',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Track added' } },
    },
  },
  '/api/v1/playlists/{id}/reorder': {
    put: {
      tags: ['Playlists'],
      summary: 'Reorder tracks within a playlist',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Tracks reordered' } },
    },
  },
  '/api/v1/playlists/{id}/songs/{songId}': {
    delete: {
      tags: ['Playlists'],
      summary: 'Remove a track from a playlist',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'songId', in: 'path', required: true, schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Track removed' } },
    },
  },

  // --- 4. Likes (2 endpoints) ---
  '/api/v1/likes/toggle': {
    post: {
      tags: ['Likes'],
      summary: 'Toggle favorite status for a song',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Like toggled' } },
    },
  },
  '/api/v1/likes/my-likes': {
    get: {
      tags: ['Likes'],
      summary: 'Retrieve all liked songs for the current user',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'List of liked tracks' } },
    },
  },

  // --- 5. Lyrics (1 endpoint) ---
  '/api/v1/lyrics': {
    get: {
      tags: ['Lyrics'],
      summary: 'Fetch synced LRC or plaintext lyrics by track title/artist',
      parameters: [
        { name: 'track', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'artist', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Synced lyrics payload' } },
    },
  },

  // --- 6. Analytics (2 endpoints) ---
  '/api/v1/analytics/events': {
    post: {
      tags: ['Analytics'],
      summary: 'Ingest high-throughput playback telemetry batch',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Events accepted & deduplicated' } },
    },
  },
  '/api/v1/analytics/insights': {
    get: {
      tags: ['Analytics'],
      summary: 'Get personalized listening insights and top genres',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Listening analytics metrics' } },
    },
  },

  // --- 7. Admin (9 endpoints) ---
  '/api/v1/admin/overview': {
    get: {
      tags: ['Admin'],
      summary: 'System metrics, active users, catalog counts',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Overview statistics' } },
    },
  },
  '/api/v1/admin/analytics': {
    get: {
      tags: ['Admin'],
      summary: 'Platform-wide event volumes and stream health',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Platform analytics' } },
    },
  },
  '/api/v1/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List system users with roles',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'User list' } },
    },
  },
  '/api/v1/admin/users/{id}/role': {
    patch: {
      tags: ['Admin'],
      summary: 'Update user authorization role (USER/ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Role updated' } },
    },
  },
  '/api/v1/admin/playlists': {
    get: {
      tags: ['Admin'],
      summary: 'Audit all platform playlists',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Playlist collection' } },
    },
  },
  '/api/v1/admin/playlists/{id}': {
    delete: {
      tags: ['Admin'],
      summary: 'Administrative deletion of violating playlist',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Playlist removed' } },
    },
  },
  '/api/v1/admin/settings': {
    get: {
      tags: ['Admin'],
      summary: 'Read system runtime configuration flags',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'System settings map' } },
    },
    put: {
      tags: ['Admin'],
      summary: 'Update system configuration keys',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Settings updated' } },
    },
  },
  '/api/v1/admin/songs/{id}/lyrics': {
    patch: {
      tags: ['Admin'],
      summary: 'Override or curate track lyrics',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { 200: { description: 'Lyrics updated' } },
    },
  },

  // --- 8. Moods (2 endpoints) ---
  '/api/v1/moods': {
    get: {
      tags: ['Discovery'],
      summary: 'List mood mix taxonomies',
      responses: { 200: { description: 'Available mood profiles' } },
    },
  },
  '/api/v1/moods/{moodId}': {
    get: {
      tags: ['Discovery'],
      summary: 'Get curated tracks matching mood criteria',
      parameters: [{ name: 'moodId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Track playlist for mood' } },
    },
  },

  // --- 9. Recommendations (2 endpoints) ---
  '/api/v1/recommendations/personalized': {
    get: {
      tags: ['Discovery'],
      summary: 'Explainable personalized recommendations based on listening vectors',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Scored recommendations' } },
    },
  },
  '/api/v1/recommendations': {
    get: {
      tags: ['Discovery'],
      summary: 'Catalog fallback recommendations',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Recommendations list' } },
    },
  },

  // --- 10. Charts (1 endpoint) ---
  '/api/v1/charts': {
    get: {
      tags: ['Discovery'],
      summary: 'Trending and top-played track leaderboard',
      responses: { 200: { description: 'Chart rankings' } },
    },
  },

  // --- 11. User Data & Privacy (2 endpoints) ---
  '/api/v1/user/export': {
    get: {
      tags: ['User Data & GDPR'],
      summary: 'Export complete user data archive as JSON',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Data export package' } },
    },
  },
  '/api/v1/user/data': {
    delete: {
      tags: ['User Data & GDPR'],
      summary: 'Permanent erasure of user history, likes, and account',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Data successfully purged' } },
    },
  },

  // --- 12. Genres & Moods taxonomy (2 endpoints) ---
  '/api/v1/genres': {
    get: {
      tags: ['Discovery'],
      summary: 'List all musical genres and cover artwork',
      responses: { 200: { description: 'Genres array' } },
    },
  },
}
