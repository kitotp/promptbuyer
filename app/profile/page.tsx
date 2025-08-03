'use client'

import { useTelegram } from '@/context/TelegramContext'
import React from 'react'

const ProfilePage = () => {

    const { dbUser } = useTelegram()

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className='w-[400px] items-center flex flex-col h-[400px] border border-black]'>
                <p className='text-[20px]'>Username: {dbUser?.username}</p>
                <p className='text-[20px]'>Balance: {dbUser?.balance}</p>
                <button className='p-2 border border-black'>Вывести средства</button>
            </div>
        </div>
    )
}

export default ProfilePage