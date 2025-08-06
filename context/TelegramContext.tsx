// context/TelegramContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useDbUser } from '@/app/queries/userQuery'

export interface TgUser {
  id: number
  username?: string
}
export type DbUser = {
  id: number
  username: string
  balance: number
  tasks_completed: number
}

interface TelegramCtx {
  tgUser: TgUser | null
  dbUser: DbUser | null
  webApp: typeof window.Telegram.WebApp | null
}

const TelegramContext = createContext<TelegramCtx>({
  tgUser: null,
  dbUser: null,
  webApp: null,
})

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [tgUser, setTgUser] = useState<TgUser | null>(null)
  const [ip, setIp] = useState<string | null>(null)
  const [webApp, setWebApp] = useState<typeof window.Telegram.WebApp | null>(null)

  useEffect(() => {
    fetch('/api/ip')
      .then(r => r.json())
      .then(({ ip }) => setIp(ip))
      .catch(() => setIp('error'))
  }, [])

  useEffect(() => {
    const wa = window.Telegram?.WebApp
    if (!wa) return
    setWebApp(wa)
    wa.ready()
    wa.expand()
    setTgUser(wa.initDataUnsafe?.user ?? null)
  }, [])

  const { data: dbUser } = useDbUser(tgUser?.id, ip)

  return (
    <TelegramContext.Provider value={{ tgUser, dbUser, webApp }}>
      {children}
    </TelegramContext.Provider>
  )
}

export const useTelegram = () => useContext(TelegramContext)
