/** Roles de realm del HRIS en orden de prioridad para elegir el rol principal del usuario. */
export const HRIS_ROLES = [
  'direccion',
  'people-talent',
  'administracion',
  'delivery-manager',
  'colaborador',
] as const;

export type HrisRole = (typeof HRIS_ROLES)[number];

export const ROLE_LABELS: Readonly<Record<HrisRole, string>> = {
  direccion: 'Dirección',
  'people-talent': 'People & Talent',
  administracion: 'Administración',
  'delivery-manager': 'Delivery Manager',
  colaborador: 'Colaborador',
};

export function isHrisRole(role: string): role is HrisRole {
  return (HRIS_ROLES as readonly string[]).includes(role);
}

/** Rol de mayor prioridad entre los del usuario, o `null` si no tiene ninguno del HRIS. */
export function primaryRole(roles: readonly HrisRole[]): HrisRole | null {
  return HRIS_ROLES.find((role) => roles.includes(role)) ?? null;
}
