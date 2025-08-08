import { supabase } from '@/app/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

    const { user_id, currency, address, amount } = await req.json()
    const apiKey = process.env.PLISIO_API_KEY!

    const url = new URL('https://api.plisio.net/api/v1/operations/withdraw');
    url.searchParams.set('currency', currency);
    url.searchParams.set('type', 'cash_out');
    url.searchParams.set('to', String(address));
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('api_key', apiKey);

    /* запрос к Plisio */
    const res = await fetch(url.toString(), { method: 'GET' });
    const text = await res.text();

    const { error: rpcErr } = await supabase
        .rpc('increment_balance', { p_user_id: user_id, p_reward: -amount })

    if (rpcErr) return NextResponse.json({ error: 'Не удалось обновить баланс' }, { status: 500 })


    if (!res.ok) {
        console.error(text);
        return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(text)); 3
}
