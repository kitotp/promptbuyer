import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTelegramInitData } from '@/app/lib/telegram/verify'
import { supabase } from '@/app/lib/supabase/server'

const bodySchema = z.object({
    currency: z.literal('TON'),
    address: z.string().min(10).max(200),
    amount: z.number().positive().optional(),
})

const MIN_WITHDRAW = 0.2

export async function POST(req: NextRequest) {
    try {
        const initData = req.headers.get('X-Telegram-Init') || ''
        const tgUser = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN!)
        if (!tgUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const userId = tgUser.id

        const raw = await req.text()
        let json: unknown
        try { json = JSON.parse(raw) } catch {
            return NextResponse.json({ error: 'Invalid JSON', raw }, { status: 400 })
        }
        const parsed = bodySchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Bad request', details: parsed.error.flatten(), got: json }, { status: 400 })
        }

        const { currency, address } = parsed.data
        const requestedAmount = parsed.data.amount

        const { data: userRow, error: userErr } = await supabase
            .from('users')
            .select('user_id, balance, wallet')
            .eq('user_id', userId)
            .single()
        if (userErr || !userRow) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (userRow.wallet && userRow.wallet !== address) {
            return NextResponse.json({ error: 'Address mismatch with saved wallet' }, { status: 400 })
        }

        const available = Number(userRow.balance || 0)
        let amount = requestedAmount ?? available
        if (amount > available) amount = available
        if (amount < MIN_WITHDRAW) {
            return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} TON` }, { status: 400 })
        }

        const { data: rpcId, error: rpcErr } = await supabase
            .rpc('create_withdraw_request', {
                p_user_id: userId,
                p_currency: currency,
                p_address: address,
                p_amount: amount
            })
        if (rpcErr || !rpcId) {
            return NextResponse.json({ error: rpcErr?.message || 'Insufficient balance' }, { status: 400 })
        }
        const withdrawalId: string = rpcId as string

        const url = new URL('https://api.plisio.net/api/v1/operations/withdraw')
        url.searchParams.set('currency', currency)
        url.searchParams.set('type', 'cash_out')
        url.searchParams.set('to', String(address))
        url.searchParams.set('amount', amount.toString())
        url.searchParams.set('api_key', process.env.PLISIO_API_KEY!)

        const res = await fetch(url.toString(), { method: 'GET' })
        const text = await res.text()

        if (!res.ok) {
            await supabase.rpc('rollback_withdraw', { p_id: withdrawalId })
            return NextResponse.json({ error: 'Provider error', provider: text }, { status: 502 })
        }

        const payload = JSON.parse(text)
        const providerTxnId = payload?.data?.txn_id ?? null

        await supabase.rpc('mark_withdraw_completed', { p_id: withdrawalId, p_txn: providerTxnId })

        return NextResponse.json({ ok: true, withdrawal_id: withdrawalId, provider_txn_id: providerTxnId })
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Internal'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}