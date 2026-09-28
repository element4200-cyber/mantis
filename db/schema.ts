import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const tokenSettings = sqliteTable('token_settings', {
  id: integer('id').primaryKey(),
  mint: text('mint'),
  ownerUserId: text('owner_user_id').notNull(),
  revision: integer('revision').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
