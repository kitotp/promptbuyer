'use client'


import { useQuery } from '@tanstack/react-query';
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

interface DbUser {
    id: number;
    username: string;
    balance: number;
    tasks_completed: number
}

interface TelegramCtx {
    tgUser: TgUser | null;
    dbUser: DbUser | null | undefined;
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

    // useEffect(() => {
    //     if (!tgUser || !ip || ip === 'error') return;

    //     fetch('/api/users', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             user_id: tgUser.id,
    //             username: tgUser.username ?? null,
    //             ip,
    //         }),
    //     })
    //         .then(r => r.json())
    //         .then(setDbUser)
    //         .catch(console.error);

    // }, [tgUser, ip]);

    const {data: dbUser} = useQuery({
        queryKey: ['dbUser', tgUser?.id],
        enabled: !!tgUser && !!ip && ip !== 'error',
        queryFn: () => 
            fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: tgUser?.id,
                    username:tgUser!.username ?? null,
                    ip,
                })
            }).then(r => r.json() as Promise<DbUser>),
            initialData: null,
            staleTime: 60000,
    })

    return (
        <TelegramContext.Provider value={{ tgUser, dbUser, webApp }}>
            {children}
        </TelegramContext.Provider>
    );
};


export const useTelegram = () => useContext(TelegramContext);
