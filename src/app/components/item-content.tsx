'use client'

import Image from 'next/image'
import type { ChatCompletionRequestMessage } from 'openai'
import { marked } from 'marked'
import parse from 'html-react-parser'

interface IItemContentProps {
  role: ChatCompletionRequestMessage['role']
  content: ChatCompletionRequestMessage['content']
}

const ItemContent = ({ role, content }: IItemContentProps) => {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-[8%] flex items-center flex-shrink-0">
        {role === 'assistant' ? (
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-200">
            <Image alt="bot avatar" src="/1.jpg" width={50} height={50} />
          </div>
        ) : (
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-200">
            <Image alt="bot avatar" src="/2.jpg" width={50} height={50} />
          </div>
        )}
      </div>

      <div className="bg-gray-100 py-2 px-4 border border-gray-400 rounded-xl flex-1 overflow-x-auto">
        {parse(marked(content))}
      </div>
    </div>
  )
}

export default ItemContent
