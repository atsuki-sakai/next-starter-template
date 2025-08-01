import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const chatRooms = sqliteTable('chat_rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => chatRooms.id),
  username: text('username').notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export type ChatRoom = typeof chatRooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;