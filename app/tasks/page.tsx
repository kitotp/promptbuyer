import TaskList from '@/components/TaskList'
import React from 'react'

const TasksPage = () => {
    return (
        <div className='flex flex-col items-center min-h-screen'>
            <h1>Список заданий</h1>
            <TaskList />
        </div>
    )
}

export default TasksPage