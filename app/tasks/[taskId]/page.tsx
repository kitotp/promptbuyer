'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type Task from '@/types/task';
import { useTelegram } from '@/context/TelegramContext';
import { useRouter } from 'next/navigation';

export default function TaskDetails() {
    const router = useRouter()
    const { taskId } = useParams<{ taskId: string }>();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const queryClient = useQueryClient();
    const { tgUser } = useTelegram();
    const tasks = queryClient.getQueryData<Task[]>(['tasks', tgUser?.id]);

    const task = useMemo(() => {
        const idNum = Number(taskId);
        if (isNaN(idNum)) return null;
        return tasks?.find((t) => t.id === idNum) ?? null;
    }, [tasks, taskId]);

    const handleSelect = (f: File | null) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        handleSelect(e.dataTransfer.files?.[0] ?? null);
    };

    if (!task) {
        return (
            <div className="flex min-h-screen items-center justify-center text-lg">
                Задание не найдено
            </div>
        );
    }

    async function onClickSend() {
        if (!file || submitting) return;

        try {
            setSubmitting(true);

            const form = new FormData();
            form.append('file', file);
            form.append('task_id', String(task?.id));
            form.append('tg_username', tgUser?.username ?? '');
            form.append('tg_user_id', String(tgUser?.id ?? ''));
            form.append('tmp_name', uuidv4());

            const resp = await fetch('/api/task-submit', { method: 'POST', body: form });
            const { result, reward, error } = (await resp.json()) as { result: string; reward: number; balance?: number; error?: string };

            if (!resp.ok) throw new Error(error || 'Server error');

            if (result === 'approved') {
                queryClient.setQueryData<Task[]>(['tasks', tgUser?.id], (prev) =>
                    prev ? prev.map((t) => (t.id === task?.id ? { ...t, done: true } : t)) : prev);

                alert(`Задание подтверждено, получено +${reward} USDT`);
                router.push('/tasks')
                return;
            } else {
                alert('Задание отклонено — проверь скриншот.');
            }
        } catch (err) {
            const e = err as Error;
            alert(e.message ?? 'Неизвестная ошибка при отправке');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
            <Link
                href="/tasks"
                className="inline-block rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
                ← Назад
            </Link>

            <header className="space-y-2">
                <h1 className="text-3xl font-bold">{task.title}</h1>
                <p className="text-gray-700">{task.description}</p>
            </header>

            <section className="rounded-xl bg-gray-100 p-4">
                <p className="select-all text-sm">{task.copy_text}</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-medium">
                    Загрузите скриншот ПОЛНОГО экрана, где видно промпт, ответ ИИ и&nbsp;ваш ник Telegram в поле ввода сообщения.
                </h2>

                <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
                     border-gray-300 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/10"
                >
                    {preview ? (
                        <img src={preview} alt="preview" className="h-40 w-auto rounded-lg object-contain" />
                    ) : (
                        <>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 opacity-60"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 15a4 4 0 0 1 4-4h1m0 0a4 4 0 0 1 4 4v1m-4-5v12m0 0h12m-12 0H3m13-9l3 3m0 0l-3 3m3-3H9"
                                />
                            </svg>
                            <span className="text-sm">
                                Перетащите файл сюда или&nbsp;
                                <span className="font-medium text-emerald-600 underline">выберите</span>
                            </span>
                        </>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
                    />
                </label>

                <button
                    disabled={!file || submitting}
                    onClick={onClickSend}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white shadow disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {submitting ? 'Отправляем…' : 'Отправить'}
                </button>
            </section>
        </div>
    );
}
