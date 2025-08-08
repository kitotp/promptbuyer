'use client'

import TaskCard from "./TaskCard";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/app/queries/tasksQuery";
import { useTelegram } from "@/context/TelegramContext";
import type Task from "@/app/types/task";

type TaskWithDone = Task & { done: boolean }

export default function TaskList() {
    const { tgUser } = useTelegram()

    const { data: tasks = [], isLoading, error } = useQuery<TaskWithDone[]>({
        queryKey: ['tasks', tgUser?.id],
        queryFn: () => fetchTasks(tgUser!.id),
        enabled: !!tgUser,
    })

    if (isLoading) return <p className="py-6">Загружаем задания</p>
    if (error) return <p className="py-6 text-red-500">{(error as Error).message}</p>

    return (
        <section className="flex flex-col items-center gap-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} done={task.done} />
            ))}
        </section>
    )
}