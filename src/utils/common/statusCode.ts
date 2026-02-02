export const HTTP_STATUS = {
  OK: 200,             // Standard success
  CREATED: 201,        // Successful post/insert
  NO_CONTENT: 204,     
  BAD_REQUEST: 400,    // General error (invalid syntax)
  UNAUTHORIZED: 401,   // No login/token provided
  FORBIDDEN: 403,      // Logged in, but not allowed to see this
  NOT_FOUND: 404,      // Page or record doesn't exist
  METHOD_NOT_ALLOWED: 405, // e.g., Trying to POST to a GET-only route
  CONFLICT: 409,       // e.g., Trying to sign up with an email that exists
  UNPROCESSABLE_ENTITY: 422, // Validation errors (common in modern APIs)
  TOO_MANY_REQUESTS: 429, // Rate limiting (spam protection)
  INTERNAL_SERVER_ERROR: 500, // The code crashed
  BAD_GATEWAY: 502,           // Server is down or rebooting
  SERVICE_UNAVAILABLE: 503,   // Server is overloaded
  GATEWAY_TIMEOUT: 504        // Server took too long to respond
};