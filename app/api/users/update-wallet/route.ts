import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { user_id, wallet_address } = (await req.json()) as {
    user_id?: number
    wallet_address?: string
  }

  if (!user_id || !wallet_address) {
    return NextResponse.json(
      { error: 'Missing user_id or wallet_address' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .update({ wallet: wallet_address })
    .eq('user_id', user_id)
    .select('wallet')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ wallet: data.wallet })
}