import { queryOptions } from "@tanstack/react-query";
import type Task from "@/types/task";


export async function fetchTasks(userId: number): Promise<(Task & { done: boolean })[]> {
    const res = await fetch(`/api/tasks?user_id=${userId}`);

    if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? res.statusText);
    }

    return res.json()
}
