'use client'

import { useTelegram } from '@/context/TelegramContext'
import React, { useState } from 'react'

const ProfilePage = () => {

    const { dbUser } = useTelegram()

    async function handleWithdraw() {
        try {

            /* параметры вывода ---------------------------------------------- */
            const currency = 'TON'
            const toAddress = 'UQBNn5k1jFubA4cgGCwbzdZkQCOZC90cp-RqT0M0VgQIeQdr'  // адрес пользователя
            const amount = 0.5   // сколько выводим
            const apiKey = 'JTc3ayf4yyiooAXhYAHMmfHIsaRx_S3ueY9K6VOgUMjz3dZgUDNCZAemR1u2Ki0u'

            const url = new URL('https://api.plisio.net/api/v1/operations/withdraw')
            url.searchParams.set('currency', currency)
            url.searchParams.set('type', 'cash_out')
            url.searchParams.set('to', toAddress)
            url.searchParams.set('amount', amount.toString())
            url.searchParams.set('api_key', apiKey!)

            const res = await fetch(url.toString(), { method: 'GET' })

            if (!res.ok) {
                const txt = await res.text()
                console.error('Plisio error:', txt)
                alert('❌ Платёж отклонён: ' + txt)
                return
            }

            const data = await res.json()
            console.log('Payout created:', data)
            alert('✅ Выплата создана! ID: ' + data.data?.txn_id)
        } catch (e) {
            console.error(e)
            alert('❌ Ошибка запроса')
        }
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