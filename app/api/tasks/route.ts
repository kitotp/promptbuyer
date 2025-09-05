import { supabase } from "@/app/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BASE_TASK = {
    id: 1,
    title: 'Основное задание',
    description: 'Выполните это задание, следуя инструкциям ниже.',
    reward: 0.9,
};

export async function GET(req: NextRequest) {

    const url = req.nextUrl;
    const idParam = url.searchParams.get('id');
    const id = idParam ? Number(idParam) : undefined;


    let done = false;

    if (id) {
        const { data: subs, error: subsErr } = await supabase
            .from('user_task_submissions')
            .select('task_id')
            .eq('user_id', id)
            .eq('task_id', BASE_TASK.id);


        if (!subsErr && subs && subs.length > 0) {
            done = true;
        }
    }

    const task = { ...BASE_TASK, done };

    return NextResponse.json([task]);
}
