'use client'

import { useTelegram } from "@/context/TelegramContext"

function App() {
  const { user } = useTelegram()


  return (
    <div className="text-white">
      Hey, {user?.username}, your id is: {user?.id}
    </div>
  )
}

export default App
