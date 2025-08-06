// lib/queries/useDbUser.ts
import { useQuery } from '@tanstack/react-query';
import type { DbUser } from '@/context/TelegramContext';

export function useDbUser(tgUserId?: number, ip?: string | null) {
  return useQuery<DbUser | null>({
    queryKey: ['dbUser', tgUserId],
    enabled: !!tgUserId && !!ip && ip !== 'error',
    queryFn: () =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: tgUserId, ip }),
      }).then(r => r.json() as Promise<DbUser>),
    initialData: null,
    staleTime: 60_000,
  });
}
