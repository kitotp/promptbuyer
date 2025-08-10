import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        null;

    const userIdParam = req.nextUrl.searchParams.get('user_id');

    if (ip && userIdParam) {
        const user_id = Number(userIdParam);
        const { data: existing, error } = await supabase
            .from('users')
            .select('user_id')
            .eq('ip', ip)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (existing && existing.user_id !== user_id) {
            return NextResponse.json({ ip, banned: true }, { status: 403 });
        }
    }

    return NextResponse.json({ ip });
}
