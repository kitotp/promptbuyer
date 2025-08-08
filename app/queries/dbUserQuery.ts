import type DbUser from "@/app/types/dbUser"

export async function fetchDbUser(userId: number, username?: string): Promise<DbUser> {
    const ipRes = await fetch('/api/ip')
    const { ip } = await ipRes.json().catch(() => ({ ip: 'error' }))

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