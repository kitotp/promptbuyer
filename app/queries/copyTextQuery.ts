export async function fetchCopyText(taskId: number, userId?: number): Promise<string> {
    const res = await fetch(`/api/tasks/${taskId}/copy?user_id=${userId ?? ""}`);
    if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? res.statusText);
    }
    const { copy_text } = (await res.json()) as { copy_text: string };
    return copy_text;
}