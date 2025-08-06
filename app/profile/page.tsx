'use client'

import { useTelegram } from '@/context/TelegramContext'
import React, { useEffect, useState } from 'react'
import type { DbUser } from '@/context/TelegramContext'

export default function ProfilePage() {
    const { dbUser, tgUser } = useTelegram() as {
      dbUser: DbUser | null
      tgUser: { id: number } | null
    }
  
    const [wallet, setWallet] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
  
    // При загрузке заполняем поле, если в БД уже есть адрес
    useEffect(() => {
      if (dbUser?.wallet) {
        setWallet(dbUser.wallet)
      }
    }, [dbUser])
  
    if (!dbUser) {
      return <div>Загрузка профиля…</div>
    }
  
    // Сохранение адреса
    async function handleSave(e: React.FormEvent) {
      e.preventDefault()
      if (!tgUser) return
      setSaving(true)
      setMessage(null)
  
      try {
        const res = await fetch('/api/users/update-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: tgUser.id,
            wallet_address: wallet.trim(),
          }),
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
  
    // Вывод средств
    async function handleWithdraw() {
      if (!wallet) {
        alert('Сначала сохраните адрес кошелька')
        return
      }
      try {
        const res = await fetch('/api/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency: 'TON',
            address: wallet,
            amount: 0.5,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        alert('✅ Выплата создана! ID: ' + data.data?.txn_id)
      } catch (err) {
        alert('Ошибка: ' + (err as Error).message)
      }
    }
  
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6">
        <div className="w-[400px] border rounded p-6 flex flex-col space-y-4">
          <p className="text-lg"><strong>Username:</strong> {dbUser.username}</p>
          <p className="text-lg"><strong>Balance:</strong> {dbUser.balance} USDT</p>
  
          {/* Форма для ввода кошелька */}
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
  
          <button
            onClick={handleWithdraw}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={saving}
          >
            Вывести 0.5 TON
          </button>
        </div>
      </div>
    )
  }