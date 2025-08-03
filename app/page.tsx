'use client';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/context/TelegramContext';

export default function App() {
  const { user } = useTelegram();
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ip')
      .then(r => r.json())
      .then(({ ip }) => setIp(ip))
      .catch(() => setIp('error'));
  }, []);

  return (
    <div className="text-white p-4 space-y-2">
      <p>
        Hey, <b>{user?.username ?? 'anon'}</b>, your id is: <b>{user?.id ?? '–'}</b>
      </p>
      <p>Your IP: <b>{ip ?? 'loading…'}</b></p>
    </div>
  );
}
