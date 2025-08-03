import supabase from "@/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { user_id, username, ip } = (await request.json()) as { user_id: number, username: string, ip: string }

    if (!user_id || !ip) {
        return NextResponse.json({ error: 'Missing id or ip of a person' }, { status: 400 })
    }

    const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('ip')
        .eq('ip', ip)
        .maybeSingle()

    if (selectError) {
        return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    if (existing) {
        return NextResponse.json({ status: 'exists', ip })
    }

    const { data: inserted, error: error } = await supabase
        .from('users')
        .insert({ user_id, username, ip })
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: 'inserted', data: inserted })
}