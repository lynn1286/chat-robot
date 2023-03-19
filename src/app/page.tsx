'use client'

import { useEffect, useRef, useState } from 'react'
import { type ChatCompletionRequestMessage } from 'openai'
import useThrottleFn from 'ahooks/lib/useThrottleFn'
import ItemContent from './components/item-content'
import Image from 'next/image'

export default function Home() {
  const messageRef = useRef<HTMLInputElement | null>(null)

  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * @description: 滚动条
   * @param {*} useThrottleFn
   * @return {*}
   */
  const { run: smoothToBottom } = useThrottleFn(
    () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    },
    { wait: 300 }
  )

  useEffect(() => {
    smoothToBottom()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  /**
   * @description: send Message
   * @param {any} e
   * @return {*}
   */
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const inputValue = messageRef.current?.value
    if (!inputValue) return

    setLoading(true)
    const newMessageList: ChatCompletionRequestMessage[] = [
      ...messages,
      {
        role: 'user',
        content: inputValue
      }
    ]
    setMessages(newMessageList)

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessageList })
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      // This data is a ReadableStream
      const data = response.body
      if (!data) {
        return
      }

      const reader = data.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        const lastMsg = newMessageList.slice(-1)[0]
        if (newMessageList.slice(-1)[0]) {
          if (newMessageList.slice(-1)[0].role === 'user') {
            newMessageList.push({
              content: chunkValue,
              role: 'assistant'
            })
          } else {
            newMessageList[newMessageList.length - 1].content = `${lastMsg.content}${chunkValue}`
          }
          setMessages([...newMessageList])
        }
        if (done) {
          messageRef.current!.value = ''
          setLoading(false)
        }
      }
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  return (
    <main className="container sm:max-w-4xl sm:mx-auto sm:px-0 px-3">
      <form className="mt-6 flex items-end" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 flex-1">
          <label className="font-bold">Say something..</label>
          <input
            className="px-4 py-2 text-gray-700 placeholder-gray-500 bg-white border border-gray-700 rounded-lg"
            required
            type="text"
            ref={messageRef}
            placeholder="Ask a question or say something nice."
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-700 rounded-lg hover:scale-110 transition-all duration-200 ml-8 w-[15%]"
        >
          Send 🚀
        </button>
      </form>

      <div className="mt-6">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center justify-items-center">
            <Image
              width={48}
              height={48}
              src="/6598519.png"
              alt="content image"
              className="mx-auto"
            />
            <p className="mt-8 text-lg font-semibold text-center text-gray-700 dark:text-gray-200">
              No chat messages, pls typing something :)
            </p>
          </div>
        ) : (
          messages.map((message, idx) => {
            return (
              <ItemContent
                role={message.role}
                content={message.content}
                key={message.content + idx}
              />
            )
          })
        )}
      </div>
    </main>
  )
}
