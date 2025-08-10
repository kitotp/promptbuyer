// app/lib/telegram/verify.ts
import crypto from 'crypto'

export function verifyTelegramInitData(initData: string, botToken: string) {
    const p = new URLSearchParams(initData)
    const hash = p.get('hash')
    if (!hash) return null

    const entries = [...p.entries()].filter(([k]) => k !== 'hash')
    const dataCheckString = entries
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join('\n')

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const check = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
    if (check !== hash) return null

    const userJson = p.get('user')
    if (!userJson) return null
    try {
        return JSON.parse(userJson) as { id: number; username?: string }
    } catch {
        return null
    }
}
