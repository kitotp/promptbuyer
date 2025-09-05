'use client'

import TaskCard from "./TaskCard";
import { useQuery } from "@tanstack/react-query";
import { fetchDbUser } from "@/app/queries/dbUserQuery";
import { fetchTasks } from "@/app/queries/tasksQuery";
import { useTelegram } from "@/context/TelegramContext";
import type Task from "@/app/types/task";
import type DbUser from "@/app/types/dbUser";


type TaskWithDone = Task & { done: boolean }

export default function TaskList() {
    const { tgUser } = useTelegram()

    const { data: dbUser, isLoading: userLoading, error: userError } = useQuery<DbUser>({
        queryKey: ['dbUser', tgUser?.id],
        queryFn: () => fetchDbUser(tgUser!.id, tgUser?.username),
        enabled: !!tgUser,
    })

    const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<TaskWithDone[]>({
        queryKey: ['tasks', dbUser?.id],
        queryFn: () => fetchTasks(dbUser!.id),
        enabled: !!tgUser && !!dbUser,
    })

    if (userLoading || tasksLoading) return <p className="py-6">Загружаем задания</p>
    if (userError) return <p className="py-6 text-red-500">{(userError as Error).message}</p>
    if (tasksError) return <p className="py-6 text-red-500">{(tasksError as Error).message}</p>

    return (
        <section className="flex flex-col items-center gap-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} done={task.done} />
            ))}
        </section>
    )
}