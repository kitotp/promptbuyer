'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type Task from '@/app/types/task';
import type DbUser from '@/app/types/dbUser';
import { useTelegram } from '@/context/TelegramContext';
import { fetchCopyText } from '@/app/queries/copyTextQuery';

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = useParams<{ taskId: string }>();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // \u2192 Добавлен контроль этапов

  const queryClient = useQueryClient();
  const { tgUser } = useTelegram();
  const tasks = queryClient.getQueryData<Task[]>(['tasks', tgUser?.id]);

  const task = useMemo(() => {
    const idNum = Number(taskId);
    if (isNaN(idNum)) return null;
    return tasks?.find((t) => t.id === idNum) ?? null;
  }, [tasks, taskId]);

  const { data: copyText, isLoading: loadingCopy } = useQuery({
    queryKey: ['copyText', task?.id, tgUser?.id],
    queryFn: () => fetchCopyText(task!.id, tgUser?.id),
    enabled: !!task && !!tgUser,
  });

  const step1Prompt = 'Ты знаешь кто такой Carlos Manuel Saraiva?';

  const handleSelect = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    handleSelect(e.dataTransfer.files?.[0] ?? null);
  };

  async function copyToClipboard(text?: string) {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      // Небольшая нотификация
      window?.dispatchEvent(new CustomEvent('copied'));
    } catch (e) {
      alert('Не удалось скопировать. Скопируйте вручную.');
    }
  }

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
      const { result, reward, balance, error } = (await resp.json()) as {
        result: string;
        reward: number;
        balance?: number;
        error?: string;
      };

      if (!resp.ok) throw new Error(error || 'Server error');

      if (result === 'approved') {
        queryClient.setQueryData<Task[]>(['tasks', tgUser?.id], (prev) =>
          prev ? prev.map((t) => (t.id === task?.id ? { ...t, done: true } : t)) : prev,
        );

        if (balance !== undefined) {
          queryClient.setQueryData<DbUser>(['dbUser', tgUser?.id], (prev) => (prev ? { ...prev, balance } : prev));
        }

        alert(`Задание подтверждено, получено +${reward} USDT`);
        router.push('/tasks');
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
      {loadingCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white">
          Ваш промпт грузится...
        </div>
      )}

      <Link href="/tasks" className="inline-block rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
        ← Назад
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{task.title}</h1>
        <p className="text-gray-700">{task.description}</p>
      </header>

      {/* Блок с этапами */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Шаг 1</div>
              <h3 className="text-lg font-semibold">Спросите у ИИ: знает ли он, кто такой Carlos Manuel Saraiva</h3>
              <p className="mt-2 text-sm text-gray-700">Скопируйте и отправьте в чат ИИ этот короткий вопрос. Дождитесь ответа.</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow hover:opacity-95"
            >
              Я получил ответ →
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-gray-100 p-3">
            <code className="block select-all text-sm">{step1Prompt}</code>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => copyToClipboard(step1Prompt)}
                className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Копировать вопрос
              </button>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${step === 1 ? 'opacity-50 pointer-events-none border-dashed' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Шаг 2</div>
              <h3 className="text-lg font-semibold">Отправьте длинный промпт</h3>
              <p className="mt-2 text-sm text-gray-700">
                Скопируйте длинный промпт ниже и отправьте его в тот же чат ИИ после ответа на Шаге 1.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(copyText)}
              disabled={!copyText}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Копировать длинный промпт
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-gray-100 p-3">
            <p className="select-all whitespace-pre-wrap text-sm">{copyText}</p>
          </div>
        </div>
      </section>

      {/* Загрузка скриншота */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          Загрузите скриншот ПОЛНОГО экрана, где видны: вопрос из Шага 1, ответ ИИ и длинный промпт (Шаг 2), а также ваш ник Telegram в поле ввода.
        </h2>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/10"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 0 1 4-4h1m0 0a4 4 0  1 4 4v1m-4-5v12m0 0h12m-12 0H3m13-9l3 3m0 0l-3 3m3-3H9" />
              </svg>
              <span className="text-sm">
                Перетащите файл сюда или&nbsp;
                <span className="font-medium text-emerald-600 underline">выберите</span>
              </span>
            </>
          )}

          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSelect(e.target.files?.[0] ?? null)} />
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