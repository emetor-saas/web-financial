import type { AuthUser } from '@/services/auth';

/** Master ignora restrições de billing no app. */
export function isMasterUser(user: AuthUser | null | undefined): boolean {
  return user?.role === 'MASTER';
}

/**
 * App: se a API ainda não enviou `billing`, não bloqueia (compat).
 * Com billing: exige canUseApp exceto master.
 */
export function tenantCanUseApp(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (isMasterUser(user)) return true;
  if (user.billing == null) return true;
  return user.billing.canUseApp;
}

/** Chat IA: só master ou assinatura paga (canUseChat). */
export function tenantCanUseChat(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (isMasterUser(user)) return true;
  if (user.billing == null) return true;
  return user.billing.canUseChat;
}
