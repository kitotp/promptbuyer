'use client'

import TaskCard from "./TaskCard";
import { useQuery } from "@tanstack/react-query";
import { tasksQuery } from "@/app/queries/tasksQuery";

export default function TaskList() {

    const { data: tasks = [], isLoading, error } = useQuery(tasksQuery)

    if (isLoading) return <p className="py-6">Загружаем задания…</p>;
    if (error) return <p className="py-6 text-red-500">{error.message}</p>;

    console.log(tasks)

    return (
        <section className="flex flex-col items-center gap-4">
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </section>
    )
}