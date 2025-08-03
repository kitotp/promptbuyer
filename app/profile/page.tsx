'use client'

import { useTelegram } from '@/context/TelegramContext'
import React from 'react'

const ProfilePage = () => {

    const { dbUser } = useTelegram()

    return (
        <>
            <div>{dbUser?.username}</div>
            <div>{dbUser?.balance}</div>
        </>
    )
}

export default ProfilePage