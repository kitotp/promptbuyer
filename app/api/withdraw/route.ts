import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // тело запроса от клиента { address, amount, currency }
    const currency = 'TON'
    const toAddress = 'UQBNn5k1jFubA4cgGCwbzdZkQCOZC90cp-RqT0M0VgQIeQdr'  // адрес пользователя
    const amount = 0.5   // сколько выводим
    const apiKey = 'JTc3ayf4yyiooAXhYAHMmfHIsaRx_S3ueY9K6VOgUMjz3dZgUDNCZAemR1u2Ki0u'

    /* сформировать URL Plisio */
    const url = new URL('https://api.plisio.net/api/v1/operations/withdraw');
    url.searchParams.set('currency', currency);       // 'TON', 'USDTTRC20', …
    url.searchParams.set('type', 'cash_out');
    url.searchParams.set('to', toAddress);
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('api_key', apiKey);   // секрет хранится ТОЛЬКО на сервере

    /* запрос к Plisio */
    const res = await fetch(url.toString(), { method: 'GET' });
    const text = await res.text();                   // Plisio всегда отвечает строкой-JSON

    if (!res.ok) {
        console.error(text);                            // логируем причину
        return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(text));       // { status:'success', data:{…} }
}
