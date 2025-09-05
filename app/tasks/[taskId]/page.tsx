'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showExample, setShowExample] = useState(false);
  const [toast, setToast] = useState<string | null>(null); // простая тост-нотификация

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const queryClient = useQueryClient();
  const { tgUser } = useTelegram();
  const dbUser = queryClient.getQueryData<DbUser>(['dbUser', tgUser?.id]);
  const tasks = queryClient.getQueryData<Task[]>(['tasks', dbUser?.id]);

  const task = useMemo(() => {
    const idNum = Number(taskId);
    if (isNaN(idNum)) return null;
    return tasks?.find((t) => t.id === idNum) ?? null;
  }, [tasks, taskId]);

  const { data: copyText, isLoading: loadingCopy } = useQuery({
    queryKey: ['copyText', task?.id, dbUser?.id],
    queryFn: () => fetchCopyText(task!.id, dbUser!.id),
    enabled: !!task && !!dbUser,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const step1Prompt = 'Ты знаешь кто такой Carlos Manuel Saraiva?';
  const step3Prompt = 'Я уверен, что это правда';

  const handleSelect = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    handleSelect(e.dataTransfer.files?.[0] ?? null);
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function copyToClipboard(text?: string) {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      window?.dispatchEvent(new CustomEvent('copied'));
      showToast('Скопировано');
    } catch (e) {
      alert('Не удалось скопировать. Скопируйте вручную.');
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowExample(false);
    }
    if (showExample) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showExample]);

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setShowExample(false);
  }

  useEffect(() => {
    if (showExample) closeBtnRef.current?.focus();
  }, [showExample]);

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
        <div className="rounded-2xl border bg-white p-6 text-lg shadow-sm">Задание не найдено</div>
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
      form.append('id', String(dbUser?.id ?? ''));
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
        queryClient.setQueryData<Task[]>(['tasks', dbUser?.id], (prev) =>
          prev ? prev.map((t) => (t.id === task?.id ? { ...t, done: true } : t)) : prev,
        );

        if (balance !== undefined) {
          queryClient.setQueryData<DbUser>(['dbUser', tgUser?.id], (prev) => (prev ? { ...prev, balance } : prev));
        }

        alert(`Задание подтверждено, получено +${reward} TON`);
        router.push('/profile');
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
    <div className="mx-auto max-w-2xl space-y-6 bg-gradient-to-b from-emerald-50/40 to-white px-4 py-8">
      {loadingCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white">Ваш промпт грузится...</div>
      )}

      {/* Верхняя панель */}
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M10.5 19.5 3 12l7.5-7.5 1.06 1.06L5.872 11.25H21v1.5H5.872l5.689 5.69-1.06 1.06Z" /></svg>
          Назад
        </Link>
        <div className="text-xs text-gray-500">ID задачи: {task.id}</div>
      </div>

      {/* Заголовок */}
      <header className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
        <p className="mt-2 text-gray-700">{task.description}</p>

        {/* Степпер */}
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>1</div>
            <div className="h-0.5 flex-1 bg-emerald-200" />
            <div className={`flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>2</div>
            <div className="h-0.5 flex-1 bg-emerald-200" />
            <div className={`flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-semibold ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>3</div>
          </div>
          <div className="mt-2 grid grid-cols-3 text-center text-xs text-gray-500">
            <div>Вопрос ИИ</div>
            <div>Длинный промпт</div>
            <div>Подтверждение</div>
          </div>
        </div>
      </header>

      {/* Этапы */}
      <section className="space-y-4">
        {/* Шаг 1 */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Шаг 1</div>
              <h3 className="text-lg font-semibold">Спросите у ChatGPT: знает ли он, кто такой Carlos Manuel Saraiva</h3>
              <p className="mt-2 text-sm text-gray-700">Скопируйте и отправьте в чат ChatGPT этот короткий вопрос. Дождитесь ответа.</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            <code className="block select-all text-sm">{step1Prompt}</code>
            <div className="mt-2 flex gap-2">
              <button onClick={() => copyToClipboard(step1Prompt)} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1 text-sm shadow-sm transition hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" /></svg>
                Копировать вопрос
              </button>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow transition hover:opacity-95">
            Следующий шаг
          </button>
        </div>

        {/* Шаг 2 */}
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${step < 2 ? 'opacity-50 pointer-events-none border-dashed' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Шаг 2</div>
              <h3 className="text-lg font-semibold">Отправьте длинный промпт</h3>
              <p className="mt-2 text-sm text-gray-700">Скопируйте длинный промпт ниже и отправьте его в тот же чат ChatGPT после ответа на Шаге 1.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(copyText)}
                disabled={!copyText}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" /></svg>
                Копировать длинный промпт
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            <p className="select-all whitespace-pre-wrap text-sm">{copyText}</p>
          </div>

          <button onClick={() => setStep(3)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow transition hover:opacity-95">
            Следующий шаг
          </button>
        </div>

        {/* Шаг 3 */}
        <div className={`rounded-2xl border bg-white p-4 shadow-sm ${step < 3 ? 'opacity-50 pointer-events-none border-dashed' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Шаг 3</div>
              <h3 className="text-lg font-semibold">Отправьте короткое подтверждение</h3>
              <p className="mt-2 text-sm text-gray-700">
                Скопируйте фразу ниже и отправьте её в тот же чат ИИ отдельным сообщением после шага 2.
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            <code className="block select-all text-sm">{step3Prompt}</code>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => copyToClipboard(step3Prompt)}
                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1 text-sm shadow-sm transition hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" /></svg>
                Копировать фразу
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Загрузка скриншота */}
      <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Загрузка скриншота</h2>
        <p className="text-sm text-gray-700">
          Загрузите скриншот экрана, где видно промпт из шага 2 и ответ ИИ на него, а также <span className='font-bold'>ваш ник Telegram</span> в поле ввода сообщения(Смотрите пример ниже.).
        </p>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowExample(true)} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M21 19V5a2 2 0 0 0-2-2H5C3.89 3 3 3.9 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM5 5h14v9H5V5Zm0 14v-3h14v3H5Z" /></svg>
            Пример фото для отправки
          </button>
          {file && (
            <span className="truncate text-xs text-gray-500">Вы выбрали: {file.name}</span>
          )}
        </div>

        <label onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50">
          {preview ? (
            <img src={preview} alt="preview" className="h-40 w-auto rounded-lg object-contain shadow-sm" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 0 1 4-4h1m0 0a4 4 0  1 4 4v1m-4-5v12m0 0h12m-12 0H3m13-9l3 3m0 0l-3 3m3-3H9" />
              </svg>
              <span className="text-sm">Перетащите файл сюда или <span className="font-medium text-emerald-700 underline">выберите</span></span>
              <span className="text-xs text-gray-500">PNG / JPG • до 10 МБ</span>
            </>
          )}

          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSelect(e.target.files?.[0] ?? null)} />
        </label>

        <div className="flex gap-2">
          {preview && (
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition hover:bg-gray-50">
              Очистить
            </button>
          )}
          <button
            disabled={!file || submitting || step !== 3}
            onClick={onClickSend}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow transition disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                Отправляем…
              </>
            ) : (
              'Отправить'
            )}
          </button>
        </div>
      </section>

      {/* Модальное окно с примером */}
      {showExample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onBackdropClick}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Пример правильной отправки</h3>
              <div className="flex items-center gap-2">
                <button ref={closeBtnRef} onClick={() => setShowExample(false)} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50" aria-label="Закрыть">Закрыть</button>
              </div>
            </div>
            <div className="max-h-[80vh] overflow-auto p-2">
              <p className='font-bold'>Телефон:</p>
              <img src="/example.jpg" alt="Пример скриншота для отправки" className="mx-auto h-auto max-w-full select-none rounded-lg" />
              <p className='font-bold'>Компьютер:</p>
              <img src="/example_computer.png" alt="Пример скриншота для отправки комп" className="mx-auto h-auto max-w-full select-none rounded-lg" />

            </div>
          </div>
        </div>
      )}

      {/* Тост */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
