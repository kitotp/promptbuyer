import { queryOptions } from "@tanstack/react-query";
import type Task from "@/types/task";


export async function fetchTasks(): Promise<Task[]> {
    const res = await fetch('/api/tasks');

    if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? res.statusText);
    }

    return res.json()
}
export const tasksQuery = queryOptions({
    queryKey: ['tasks'],
    queryFn: fetchTasks
})