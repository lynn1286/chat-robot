import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { createParser } from 'eventsource-parser'
import type { ChatCompletionRequestMessage } from 'openai'
import { Configuration, OpenAIApi } from 'openai'
// import { httpsOverHttp } from 'tunnel'

// 配置代理服务器
// const tunnel = httpsOverHttp({
//   proxy: {
//     host: "127.0.0.1",
//     port: 9999,
//   },
// });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
  // baseOptions: {
  //   httpsAgent: process.env.NODE_ENV === 'development' ? tunnel : null,
  //   proxy: false
  // }
})

const openai = new OpenAIApi(configuration)

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatCompletionRequestMessage[] }

  if (!configuration.apiKey) {
    return new Response('OpenAI API key not configured, please follow instructions in README.md')
  }

  const hasMsg = messages?.[messages.length - 1]?.content
  if (hasMsg.trim().length === 0) {
    return new Response('Please enter valid information')
  }

  const completion = await openai.createChatCompletion(
    {
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 1024,
      n: 1,
      stream: true
    },
    { responseType: 'stream' }
  )

  let counter = 0
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const stream = new ReadableStream({
    async start(controller) {
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === '[DONE]') {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const _data = json.choices[0]
            // text
            let text
            if (_data.text !== undefined) {
              text = _data.text
            } else if (_data.delta) {
              text = _data.delta?.content || ''
            }
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return
            }
            const queue = encoder.encode(text)
            controller.enqueue(queue)
            counter++
          } catch (e) {
            // maybe parse error
            controller.error(e)
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse)
      // @ts-ignore
      completion.data.on('data', (data: any) => {
        parser.feed(decoder.decode(data))
      })
    }
  })

  return new Response(stream)
}
