import type Task from "@/app/types/task";


export async function fetchTasks(userId: number): Promise<(Task & { done: boolean })[]> {
    const res = await fetch(`/api/tasks?id=${userId}`);

    if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? res.statusText);
    }

    return res.json()
}
