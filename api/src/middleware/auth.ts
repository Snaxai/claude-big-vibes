/**
 * Stub auth middleware.
 * TODO: Replace with better-auth for proper authentication.
 * This currently returns a hardcoded "default" user ID.
 */
export function getUserId(_req: Request): string {
  return "default";
}
