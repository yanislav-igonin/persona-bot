import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Keep generate/typecheck working when DATABASE_URL is not present.
    url: process.env.DATABASE_URL ?? '',
  },
});
