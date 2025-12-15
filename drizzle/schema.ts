import { pgTable, uuid, varchar, boolean, text, integer, jsonb, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const roleEnum = pgEnum('role', ['STUDENT', 'ADMIN', 'DEPARTMENT_ADMIN'])
export const templateCategoryEnum = pgEnum('template_category', ['FYB', 'SIGNOUT'])
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'COMPLETED', 'FAILED'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  role: roleEnum('role').notNull().default('STUDENT'),
  department: varchar('department', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Email verification tokens table
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Templates table
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: templateCategoryEnum('category').notNull(),
  isLocked: boolean('is_locked').notNull().default(false),
  lockedDepartment: varchar('locked_department', { length: 255 }),
  usageCount: integer('usage_count').notNull().default(0),
  previewImage: varchar('preview_image', { length: 500 }).notNull(),
  canvasConfig: jsonb('canvas_config'),
  fields: jsonb('fields'),
  status: varchar('status', { length: 50 }).notNull().default('public'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Downloads table
export const downloads = pgTable('downloads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  downloadCount: integer('download_count').notNull().default(0),
  freeEditUsed: boolean('free_edit_used').notNull().default(false),
  lastDownloadAt: timestamp('last_download_at'),
  downloadUrl: text('download_url'),
  emailSent: boolean('email_sent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userTemplateUnique: unique().on(table.userId, table.templateId),
}))

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  reference: varchar('reference', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Department access table
export const departmentAccess = pgTable('department_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  department: varchar('department', { length: 255 }).notNull(),
  accessCode: varchar('access_code', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usageLimit: integer('usage_limit').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  templateAccessCodeUnique: unique().on(table.templateId, table.accessCode),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  downloads: many(downloads),
  payments: many(payments),
  emailTokens: many(emailVerificationTokens),
}))

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}))

export const templatesRelations = relations(templates, ({ many }) => ({
  downloads: many(downloads),
  payments: many(payments),
  departmentAccess: many(departmentAccess),
}))

export const downloadsRelations = relations(downloads, ({ one }) => ({
  user: one(users, {
    fields: [downloads.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [downloads.templateId],
    references: [templates.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [payments.templateId],
    references: [templates.id],
  }),
}))

export const departmentAccessRelations = relations(departmentAccess, ({ one }) => ({
  template: one(templates, {
    fields: [departmentAccess.templateId],
    references: [templates.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert
export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert
export type Download = typeof downloads.$inferSelect
export type NewDownload = typeof downloads.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type DepartmentAccess = typeof departmentAccess.$inferSelect
export type NewDepartmentAccess = typeof departmentAccess.$inferInsert

export type Role = 'STUDENT' | 'ADMIN' | 'DEPARTMENT_ADMIN'
export type TemplateCategory = 'FYB' | 'SIGNOUT'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

