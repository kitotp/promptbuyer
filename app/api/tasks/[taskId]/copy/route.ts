import { NextRequest, NextResponse } from 'next/server';
import { generateCopyText } from '@/AnthropicGeneration';

export async function GET(req: NextRequest) {
    const userIdParam = req.nextUrl.searchParams.get('user_id');
    const user_id = userIdParam ? Number(userIdParam) : undefined;
    const copy_text = await generateCopyText(user_id);
    return NextResponse.json({ copy_text });
}