'use client'

import { useDbUser } from '@/app/queries/userQuery';

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

export type DbUser = {
    id: number;
    username: string;
    balance: number;
    tasks_completed: number
}

interface TelegramCtx {
    tgUser: TgUser | null;
    dbUser: DbUser | null;
    webApp: typeof window.Telegram.WebApp | null;
}

const TelegramContext = createContext<TelegramCtx>({
    tgUser: null,
    dbUser: null,
    webApp: null,
});


export const TelegramProvider = ({ children }: { children: ReactNode }) => {
    const [tgUser, setTgUser] = useState<TgUser | null>(null);
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
        setTgUser(tg);
    }, []);


    const { data: dbUser } = useDbUser(tgUser?.id, ip);

    return (
        <TelegramContext.Provider value={{ tgUser, dbUser, webApp }}>
            {children}
        </TelegramContext.Provider>
    );
};


export const useTelegram = () => useContext(TelegramContext);
