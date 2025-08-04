import supabase from "@/supabase";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    const url = req.nextUrl
    const userIdParam = url.searchParams.get('user_id')
    const user_id = userIdParam ? Number(userIdParam) : null

    const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')

    if (tasksErr) {
        return NextResponse.json({ error: tasksErr.message }, { status: 500 })
    }

    const doneTaskIds = new Set<number>()
    if (user_id) {
        const { data: subs, error: subsErr } = await supabase
            .from('user_task_submissions')
            .select('task_id')
            .eq('user_id', user_id)

        if (!subsErr && subs) {
            subs.forEach((s) => {
                doneTaskIds.add(Number(s.task_id))
            })
        }
    }

    const enriched = tasks.map((t) => ({
        ...t,
        done: doneTaskIds.has(t.id)
    }))

    return NextResponse.json(enriched)
}