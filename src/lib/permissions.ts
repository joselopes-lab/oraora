export const ADMIN_USER_TYPES = [
  'admin',
  'super_admin',
  'construtora_admin',
  'imobiliaria_admin',
] as const;

export function isAdminUser(userType?: string): boolean {
  if (!userType) return false;
  return (ADMIN_USER_TYPES as readonly string[]).includes(userType);
}
