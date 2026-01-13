/**
 * Validates that required environment variables are present
 * @param {Object} env - Environment variables object
 * @param {string[]} required - Array of required variable names
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateEnv(env, required) {
  const missing = required.filter((key) => !env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Creates a JSON error response for missing environment variables
 * @param {string[]} missing - Array of missing variable names
 * @returns {Response}
 */
export function createMissingEnvResponse(missing) {
  return new Response(
    JSON.stringify({
      error: "Missing required environment variables",
      missing,
      message: `Please configure the following environment variables: ${missing.join(", ")}`,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Validates and returns error response if validation fails
 * @param {Object} env - Environment variables object
 * @param {string[]} required - Array of required variable names
 * @returns {Response|null} Error response or null if valid
 */
export function checkEnvOrFail(env, required) {
  const validation = validateEnv(env, required);

  if (!validation.valid) {
    return createMissingEnvResponse(validation.missing);
  }

  return null;
}
