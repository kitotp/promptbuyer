'use client';

import { supabase } from '@/app/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type Task from '@/types/task';
import { v4 as uuidv4 } from 'uuid'
import { useTelegram } from "@/context/TelegramContext";

export default function TaskDetails() {

    const { taskId } = useParams<{ taskId: string }>();

    const queryClient = useQueryClient();
    const tasks = queryClient.getQueryData<Task[]>(['tasks']);
    const { tgUser } = useTelegram()
    const task = useMemo(
        () => {
            const idNum = Number(taskId);
            if (isNaN(idNum)) return null;
            return tasks?.find((t) => t.id === idNum) ?? null;
        },
        [tasks, taskId],
    );

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

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

    async function handleSubmitTask(file: File | null) {

        if (!file) {
            alert('No file provided')
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`


        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('submitions')
            .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (!uploadData || uploadError) {
            throw new Error('Error uploading image', uploadError)
        }

        const { data: publicData } = await supabase
            .storage
            .from('submitions')
            .getPublicUrl(fileName)
        const image_url = publicData.publicUrl

        const payload = {
            task_id: task?.id,
            image_url,
            tg_username: tgUser?.username,
            tg_user_id: tgUser?.id,
        };

        const resp = await fetch('/api/task-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await resp.json();

        if (resp.ok) {
            if (data.result === 'approved') {
                alert(`Задание подтверждено, получено +${data.reward} USDT`);
            } else {
                alert('Задание отклонено — проверь скриншот и попробуй снова (если логика позволяет).');
            }
        } else {
            alert(data.error || 'Ошибка при отправке');
        }
    }

    return (
        <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
            <Link href="/tasks" className="inline-block rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
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
                <h2 className="text-lg font-medium">Загрузите скриншот ПОЛНОГО экрана где будет видно промпт, ответ на него от ИИ а также оставьте в поле ввода сообщений ваш ник телеграмм.</h2>

                <label onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
                     border-gray-300 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/10">
                    {preview ? (
                        <img
                            src={preview}
                            alt="preview"
                            className="h-40 w-auto rounded-lg object-contain"
                        />
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
                                Перетащите фото сюда или&nbsp;
                                <span className="font-medium text-emerald-600 underline">
                                    выберите&nbsp;файл
                                </span>
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

                <button disabled={!file} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white shadow disabled:cursor-not-allowed disabled:bg-gray-400"
                    onClick={() => file && handleSubmitTask(file)}
                >
                    Отправить
                </button>
            </section>
        </div>
    );
}
