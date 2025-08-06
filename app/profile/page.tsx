'use client'

import { useTelegram } from '@/context/TelegramContext'
import React from 'react'

const ProfilePage = () => {

    const { dbUser } = useTelegram()

    if (!dbUser) {
        return (
          <div className="flex h-screen items-center justify-center">
            Загружаем профиль…
          </div>
        )
      }
    async function handleWithdraw() {


        const res = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currency: 'TON',
                address: 'UQBNn5k1jFubA4cgGCwbzdZkQCOZC90cp-RqT0M0VgQIeQdr',
                amount: 0.5
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        alert('✅ Выплата создана! ID: ' + data.data?.txn_id);

    }

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className='w-[400px] items-center flex flex-col h-[400px] border border-black]'>
                <p className='text-[20px]'>Username: {dbUser?.username}</p>
                <p className='text-[20px]'>Your balance: {dbUser?.balance}</p>
                <button className='p-2 border border-black' onClick={handleWithdraw}>Вывести средства</button>
            </div>
        </div>
    )
}

export default ProfilePage