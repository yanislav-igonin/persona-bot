System Patterns

- Bot orchestration: grammY middleware chain saves user and chat before handling message.
- Repository pattern wraps Prisma access for users, chats, and replies.
- Prompt builder composes system and user messages, including a words list instruction in Russian.
- Logging uses simple timestamped console output.
- Configuration comes from environment via values helpers.
