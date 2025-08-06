// lib/queries/useDbUser.ts
import { useQuery } from '@tanstack/react-query'
import type { DbUser } from '@/context/TelegramContext'

export function useDbUser(tgUserId?: number, ip?: string | null) {
  return useQuery<DbUser | null>({
    queryKey: ['dbUser', tgUserId, ip],
    enabled: !!tgUserId && !!ip && ip !== 'error',
    queryFn: ({ queryKey }) => {
      const [, userId, clientIp] = queryKey as [string, number, string]
      return fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ip: clientIp }),
      }).then(r => r.json() as Promise<DbUser>)
    },
    initialData: null,
    staleTime: 60_000,
  })
}
