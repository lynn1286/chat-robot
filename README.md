## Running Locally

* Use pnpm
* After cloning the repo, go to [OpenAI](https://beta.openai.com/account/api-keys) to make an account and put your API key in a file called `.env` .
* Config proxy to your own [httpsOverHttp](./src/app/api/bot/route.ts#L5-L10)

Then, run the application in the command line and it will be available at `http://localhost:3000` .

```bash
 pnpm run dev
```

## TODOs

* [ ] markdown format
* [ ] support context
* [ ] change api
* [ ] change api params 
* [ ] download chats
* [ ] copy content
* [ ] select chats share(image)
