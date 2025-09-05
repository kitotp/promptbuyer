import { NextRequest, NextResponse } from 'next/server';
import { generateCopyText } from '@/AnthropicGeneration';

export async function GET(req: NextRequest) {
    const idParam = req.nextUrl.searchParams.get('id');
    const id = idParam ? Number(idParam) : undefined;
    const copy_text = await generateCopyText(id);
    return NextResponse.json({ copy_text });
}