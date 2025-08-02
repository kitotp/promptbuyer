'use client'

import { useTelegram } from "@/context/TelegramContext"

function App() {
  const { user } = useTelegram()


  return (
    <div className="text-white">
      Hey, {user?.username}, your id: {user?.id}
    </div>
  )
}

export default App
