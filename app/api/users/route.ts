import supabase from "@/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { user_id, username, ip } = (await request.json()) as { user_id: number, username: string, ip: string }

    if (!user_id || !ip) {
        return NextResponse.json({ error: 'Missing id or ip of a person' }, { status: 400 })
    }

    let { data: user } = await supabase
        .from('users')
        .select('ip')
        .eq('ip', ip)
        .maybeSingle()

    if (!user) {
        const { data: inserted, error: insErr } = await supabase
            .from('users')
            .insert({ user_id, username, ip, balance: 0 })
            .select()
            .single();

        if (insErr)
            return NextResponse.json({ error: insErr.message }, { status: 500 });

        user = inserted;
    }

    return NextResponse.json(user)
}