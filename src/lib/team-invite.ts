export const DEFAULT_INVITE_EXPIRATION_DAYS = 14;

export function calculateInviteExpiration(
  days: number = DEFAULT_INVITE_EXPIRATION_DAYS
) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
