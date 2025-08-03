'use client'

import { useTelegram } from '@/context/TelegramContext'
import React from 'react'

const ProfilePage = () => {

    const { dbUser } = useTelegram()

    return (
        <>
            1231231
            <p>{dbUser?.username}</p>
            <p>{dbUser?.balance}</p>
        </>
    )
}

export default ProfilePage