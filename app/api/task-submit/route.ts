import { supabase } from "@/app/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { task_id, image_url, tg_username, tg_user_id } = await req.json()

        const { data: task, error: taskErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .single()

        if (taskErr || !task) {
            return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
        }

        const prompt = `Does the image contain a ChatGPT page with a '${tg_username}' in an input form and a prompt ${task.copy_text} already written as a message and AI has responded to it? Answer only yes or no. `

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: image_url
                        },
                    },
                ],
            }],
        });

        const answerRaw = response?.choices[0]?.message?.content?.trim().toLowerCase();
        const approved = answerRaw?.startsWith('yes');


        const insertResp = await supabase.from('user_task_submissions').insert({
            user_id: tg_user_id,
            task_id: task_id,
        })

        if (insertResp.error) {
            return NextResponse.json({ error: 'Не удалось сохранить сабмишн' }, { status: 500 });
        }


        // UPDATE BALANCE
        // if (approved) {
        //     const { error: updateErr } = await supabase
        //         .from('users') 
        //         .update({
        //             balance: supabase.raw('balance + ?', [task.reward]),
        //             tasks_completed: supabase.raw('tasks_completed + 1'),
        //         })
        //         .eq('user_id', tg_user_id);

        //     if (updateErr) {
        //         console.error('reward update error', updateErr);
        //     }
        // }

        return NextResponse.json({
            result: approved ? 'approved' : 'rejected',
            reward: approved ? task.reward : 0,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Некорректные данные или внутренняя ошибка' }, { status: 400 });
    }
}
