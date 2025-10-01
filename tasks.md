# Final Plan: Dialogs + Messages (minimal, no chatId on Message)

## Description
Implement minimal dialog threading using new Dialog and Message tables. Keep existing User and Chat unchanged. Store all Telegram identifiers as String. Remove usage of legacy Reply in app code.

## Data Model (Prisma additions)
```prisma
model Dialog {
  id        Int      @id @default(autoincrement())
  chatId    String
  createdAt DateTime @default(now())

  chat      Chat     @relation(fields: [chatId], references: [id])
  messages  Message[]

  @@map("dialogs")
}

model Message {
  id         Int      @id @default(autoincrement())
  telegramId String
  text       String
  createdAt  DateTime @default(now())
  userId     String   // use "0" for bot messages
  botRole    String?  // NULL for user messages
  dialogId   Int

  dialog     Dialog   @relation(fields: [dialogId], references: [id])

  // Protect uniqueness within a dialog (Telegram ids are unique per chat; dialog is subset)
  @@unique([dialogId, telegramId], name: "dialog_message_unique")
  @@index([telegramId])
  @@index([dialogId, createdAt])
  @@map("messages")
}
```

## Repositories
- dialog.repository.ts
  - create({ chatId }: { chatId: string })
  - getById(id: number)
- message.repository.ts
  - create({ telegramId, text, userId, botRole, dialogId })
  - getByChatAndTelegramId(chatId: string, telegramId: string) // via relation: where { telegramId, dialog: { chatId } }
  - listByDialogId(dialogId: number): Message[] (asc by createdAt)

## Bot Flow (grammy)
- On message:text
  - If reply_to_message exists and reply_to_message.from?.is_bot is true
    - parentId = reply_to_message.message_id.toString()
    - parent = messageRepo.getByChatAndTelegramId(chatId, parentId)
    - dialogId = parent?.dialogId ?? (await dialogRepo.create({ chatId })).id
    - Save user message with current telegramId and dialogId
    - Fetch history via listByDialogId(dialogId); build AI messages; get completion; send; save bot message with returned telegramId
  - Else
    - Apply existing random encounter gate; if not triggered, return
    - If triggered: create Dialog; save user message; call AI (no history); send; save bot message

## Prompt Integration
- buildHistoryMessages(history: Message[], personality: string, words: string[], latestUserText: string) -> ChatCompletionMessageParam[] mapping: user when botRole is NULL, assistant when botRole is set
- getCompletionWithHistory({ personality, words, messages })

## Implementation Steps
1) Update prisma/schema.prisma with Dialog and Message models (Message has no chatId)
2) Run prisma migrate and regenerate client
3) Add repositories and export in src/repositories/index.ts
4) Update src/bots.ts to use reply-to logic and persist messages; remove reply.repository usage
5) Update src/prompt.ts with history-aware helpers
6) Verify end to end in Telegram

## Testing
- Send a message (no reply): dialog created; two Message rows saved
- Reply to bot: parent lookup by telegramId within chat via relation to Dialog; same dialog used; history loaded; new bot message saved
- Uniqueness on (dialogId, telegramId) enforced
