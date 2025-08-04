export const runtime = 'nodejs';

import { supabase } from '@/app/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        /* -------- multipart -------- */
        const form = await req.formData();
        const file = form.get('file') as File | null;
        const task_id = Number(form.get('task_id'));
        const tg_username = String(form.get('tg_username') ?? '');
        const tg_user_id = Number(form.get('tg_user_id'));
        const tmpName = form.get('tmp_name') as string | null;

        if (!file || Number.isNaN(task_id) || Number.isNaN(tg_user_id)) {
            return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
        }

        const ext = file.name.split('.').pop();
        const fileName = `${tmpName ?? uuidv4()}.${ext}`;

        const { error: upErr } = await supabase.storage
            .from('submitions')
            .upload(fileName, Buffer.from(await file.arrayBuffer()), {
                contentType: file.type,
            });

        if (upErr) throw upErr;

        const { data: pub } = await supabase.storage
            .from('submitions')
            .getPublicUrl(fileName);

        const image_url = pub.publicUrl;

        const { data: task, error: tErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .single();

        if (tErr || !task) {
            return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 });
        }

        const prompt = `Does the image contain a ChatGPT page with a '${tg_username}' in an input form and a prompt ${task.copy_text} already written as a message and AI has responded to it? Answer only yes or no.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: image_url } },
                    ],
                },
            ],
        });

        const approved = completion.choices[0].message.content
            ?.trim()
            ?.toLowerCase()
            ?.startsWith('yes');

        if (approved) {
            /* -------- store submission -------- */
            const { error: insErr } = await supabase
                .from('user_task_submissions')
                .insert({ user_id: tg_user_id, task_id });

            if (insErr) {
                return NextResponse.json({ error: 'Не удалось сохранить сабмишн' }, { status: 500 });
            }
        }

        return NextResponse.json({
            result: approved ? 'approved' : 'rejected',
            reward: approved ? task.reward : 0,
        });
    } catch (e) {
        const err = e as Error;
        console.error(err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
