# Persona Bot

Bot that randomly replies in Telegram chats on anyone's messages with a certain predefined personality. Answers are generated with an LLM, and bots can optionally answer with generated images plus a short caption.

# Stack
- Typescript
- grammY
- Prisma

# Run
1. Install dependencies:
```
npm install
```
2. Make `.env` file from `.env.example`
3. Push database schema:
```
npx prisma db push
```
4. Run bot:
```
npm run dev
```

# Image replies
- `IMAGE_REPLIES_ENABLED=true` turns on persona-based image replies.
- `OPENAI_API_KEY` is used by the default image provider.
- `IMAGE_REPLY_CHANCE` controls how often bots may spontaneously choose an image reply when the user did not explicitly ask for one.

# Deploy
Can be deployed to any VPS or cloud service. I recommend using [Railway](https://railway.app/) for this purpose.
