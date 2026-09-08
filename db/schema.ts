import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const members = sqliteTable('members', {
  id: text('id').primaryKey(), awsSbgId: text('aws_sbg_id').notNull().unique(),
  data: text('data').notNull(), status: text('status').notNull(), revision: integer('revision').notNull().default(1),
});
export const generatedIds = sqliteTable('generated_ids', {
  id: text('id').primaryKey(), memberId: text('member_id').notNull().references(() => members.id),
  data: text('data').notNull(), createdAt: text('created_at').notNull(),
});
export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(), memberId: text('member_id').notNull(),
  message: text('message').notNull(), createdAt: text('created_at').notNull(),
});
export const settings = sqliteTable('settings', { id: text('id').primaryKey(), data: text('data').notNull(), revision: integer('revision').notNull().default(1) });
