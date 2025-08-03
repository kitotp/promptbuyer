'use client'


import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

interface TgUser {
    id: number;
    username?: string;
}

interface TelegramCtx {
    user: TgUser | null;
    webApp: typeof window.Telegram.WebApp | null;
}

const TelegramContext = createContext<TelegramCtx>({
    user: null,
    webApp: null,
});


export const TelegramProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<TgUser | null>(null);
    const [ip, setIp] = useState<string | null>(null);
    const [webApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(
        null,
    );

    useEffect(() => {
        fetch('/api/ip')
            .then(r => r.json())
            .then(({ ip }) => setIp(ip))
            .catch(() => setIp('error'));
    }, []);

    useEffect(() => {
        const webapp = window.Telegram?.WebApp;
        if (!webapp) return;

        setWebApp(webapp);

        webapp.ready();
        webapp.expand();

        const tg = webapp.initDataUnsafe?.user ?? null;
        setUser(tg);
    }, []);

    useEffect(() => {
        if (!user || !ip || ip === 'error') return;

        fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, username: user.username, ip }),
        }).catch(console.error);

    }, [user, ip]);

    return (
        <TelegramContext.Provider value={{ user, webApp }}>
            {children}
        </TelegramContext.Provider>
    );
};


export const useTelegram = () => useContext(TelegramContext);
