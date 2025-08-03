'use client';

import { useTelegram } from '@/context/TelegramContext';

export default function App() {
  const { user } = useTelegram();

  return (
    <div className="text-white p-4 space-y-2">
      <p>
        Hey, <b>{user?.username ?? 'anon'}</b>, your id is: <b>{user?.id ?? '–'}</b>
      </p>
    </div>
  );
}
