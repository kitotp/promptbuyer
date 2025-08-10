import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTelegramInitData } from '@/app/lib/telegram/verify'
import { supabase } from '@/app/lib/supabase/server'

const schema = z.object({ wallet_address: z.string().min(10).max(200) })

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get('X-Telegram-Init') || ''
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'No TELEGRAM_BOT_TOKEN' }, { status: 500 })

    const tgUser = verifyTelegramInitData(initData, token)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.text()
    let json: unknown
    try { json = JSON.parse(raw) } catch {
      return NextResponse.json({ error: 'Invalid JSON', raw }, { status: 400 })
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad request', details: parsed.error.flatten(), got: json }, { status: 400 })
    }

    const { wallet_address } = parsed.data
    const { error } = await supabase
      .from('users')
      .update({ wallet: wallet_address })
      .eq('user_id', tgUser.id)

    if (error) return NextResponse.json({ error: error.message || 'DB error' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
