Persona Bot – Project Brief

Purpose
- Telegram bot that randomly replies in chats with a predefined personality.

Key behavior
- Listens to text messages via grammY.
- With a random chance, prepares a prompt from the incoming text plus persona context and words list.
- Requests a short reply from x.ai Grok model.
- Replies in the chat and records the interaction.

Configuration
- Personas come from env PERSONAS (JSON).
- Random trigger probability from env RANDOM_ENCOUNTER_CHANCE (default 0.1).
- API key via env GROK_API_KEY (OpenAI key optional).
- ENV sets environment.
- Prisma requires DATABASE_URL.

Data model (Prisma)
- User(id, username?, firstName?, lastName?, language?, createdAt)
- Chat(id, name, type, isAllowed, createdAt)
- Reply(id, input, output, createdAt, userId, chatId, botRole)

Non goals
- Not a conversational thread; replies are short (<= 500 chars).
