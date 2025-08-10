import type DbUser from "@/app/types/dbUser"

export async function fetchDbUser(userId: number, username?: string): Promise<DbUser> {
    const ipRes = await fetch(`/api/ip?user_id=${userId}`)
    const ipData = await ipRes.json().catch(() => ({ ip: 'error' }))
    if (!ipRes.ok) {
        const { error } = ipData as { error?: string }
        throw new Error(error ?? 'Access denied')
    }
    const { ip } = ipData as { ip: string }

    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, username: username ?? null, ip }),
    })

    if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? res.statusText)
    }

    return res.json()
}