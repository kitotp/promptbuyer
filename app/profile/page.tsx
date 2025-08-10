'use client'

import { useTelegram } from '@/context/TelegramContext'
import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDbUser } from '@/app/queries/dbUserQuery'
import type DbUser from '@/app/types/dbUser'

export default function ProfilePage() {
  const { tgUser } = useTelegram()
  const queryClient = useQueryClient();

  const { data: dbUser, isLoading } = useQuery<DbUser>({
    queryKey: ['dbUser', tgUser?.id],
    queryFn: () => fetchDbUser(tgUser!.id, tgUser?.username),
    enabled: !!tgUser,
  })

  function copy() {
    const init = getTelegramInitData()
    navigator.clipboard.writeText(init)
      .then(() => alert('initData скопирован!'))
      .catch(() => alert('Не удалось скопировать'))
  }

  const [wallet, setWallet] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (dbUser?.wallet) {
      setWallet(dbUser.wallet)
    }
  }, [dbUser])

  if (isLoading || !dbUser) {
    return <div>Загрузка профиля…</div>
  }
  function getTelegramInitData(): string {
    if (typeof window === 'undefined') return ''
    return window.Telegram?.WebApp?.initData ?? ''
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!tgUser) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init': getTelegramInitData()
        },
        body: JSON.stringify({ wallet_address: wallet.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка при сохранении')
      setMessage('Адрес сохранён ✅')
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleWithdraw() {
    if (!wallet) {
      alert('Сначала сохраните адрес кошелька')
      return
    }
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init': getTelegramInitData(),
        },
        body: JSON.stringify({
          currency: 'TON',
          address: wallet,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      alert('✅ Выплата создана! ID: ' + data.withdrawal_id)
      queryClient.invalidateQueries({ queryKey: ['dbUser', tgUser?.id] })
    } catch (err) {
      alert('Ошибка: ' + (err as Error).message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <div className="w-[400px] border rounded p-6 flex flex-col space-y-4">
        <p className="text-lg"><strong>Username:</strong> {dbUser.username}</p>
        <p className="text-lg"><strong>Balance:</strong> {dbUser.balance} TON</p>

        <form onSubmit={handleSave} className="flex flex-col space-y-2">
          <label className="text-sm font-medium">TON Wallet Address</label>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="Введите адрес вашего TON кошелька"
            className="border rounded px-3 py-2"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>

        {message && (
          <p className="text-sm text-center">{message}</p>
        )}
        {dbUser.balance >= 0.2 ?
          <button
            onClick={handleWithdraw}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={saving}
          >
            Вывести {dbUser.balance} TON
          </button>
          : (
            <div className='flex flex-col items-center justify-center'>
              <p className='text-[12px] text-gray-300'>Minimum withdrawal amount is 0.2TON</p>
              <button className='bg-gray-500 p-2 text-[17px]' disabled>Not enough balance</button>
            </div>
          )}
      </div>
      <button onClick={copy}>Скопировать initData</button>
    </div>
  )
}