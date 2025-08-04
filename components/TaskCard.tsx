// components/TaskCard.tsx
import React from 'react'
import type Task from '@/types/task'
import Link from 'next/link'

interface TaskWithDone extends Task {
    done?: boolean
}

interface Props {
    task: TaskWithDone
    done?: boolean
}

const TaskCard = ({ task, done = false }: Props) => {
    const content = (
        <>
            <h2 className="font-bold text-lg">{task.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
            </p>
            <span className="text-emerald-500 font-semibold">
                +{task.reward} USDT
            </span>
        </>
    )

    if (done) {
        return (
            <div className="w-full max-w-md p-4 border rounded-lg bg-gray-100 opacity-60 cursor-not-allowed">
                {content}
                <div className="mt-2 text-sm text-gray-600">Уже выполнено</div>
            </div>
        )
    }

    return (
        <Link
            href={`/tasks/${task.id}`}
            className="w-full max-w-md p-4 border rounded-lg hover:bg-gray-50"
        >
            {content}
        </Link>
    )
}

export default TaskCard
