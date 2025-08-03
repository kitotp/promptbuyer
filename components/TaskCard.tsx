import React from 'react'
import type Task from '@/types/task'
import Link from 'next/link'



const TaskCard = ({ task }: { task: Task }) => {
    return (
        <Link
            href={`/tasks/${task.id}`}
            className="w-full max-w-md p-4 border rounded-lg hover:bg-gray-50"
        >
            <h2 className="font-bold text-lg">{task.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
            </p>
            <span className="text-emerald-500 font-semibold">
                +{task.reward} USDT
            </span>
        </Link>
    )
}

export default TaskCard