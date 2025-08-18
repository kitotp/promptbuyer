import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <div className='fixed bottom-0 left-0 w-full h-[var(--footer-height)] rounded-t-[24px] bg-amber-700'>
            <div className='flex gap-3 flex-row h-full items-center justify-center'>
                <Link href={'/tasks'} className='border border-black p-2 font-bold'>Задание</Link>
                <Link href={'/profile'} className='border border-black p-2 font-bold'>Профиль</Link>
            </div>
        </div>
    )
}

export default Footer