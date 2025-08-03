import supabase from '@/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { user_id, username, ip } = (await req.json()) as {
        user_id?: number;
        username?: string;
        ip?: string;
    };

    if (!user_id || !ip) {
        return NextResponse.json({ error: 'Missing user_id or ip' }, { status: 400 });
    }

    const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

    if (selectError) {
        return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    let user = existingUser;

    if (!user) {
        const { data: inserted, error: insErr } = await supabase
            .from('users')
            .insert({
                user_id,
                username,
                ip,
                balance: 0,
                tasks_completed: 0,
            })
            .select()
            .single();

        if (insErr) {
            return NextResponse.json({ error: insErr.message }, { status: 500 });
        }

        user = inserted;
    }

    return NextResponse.json(user);
}
