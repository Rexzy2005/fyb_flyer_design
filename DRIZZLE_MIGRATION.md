# Drizzle ORM Migration Guide

## ✅ Migration Complete

The project has been successfully migrated from Prisma ORM to Drizzle ORM.

## What Changed

### 1. Dependencies
- **Removed:** `@prisma/client`, `prisma`
- **Added:** `drizzle-orm`, `drizzle-kit`, `postgres`, `pg`, `@types/pg`

### 2. Schema
- **Old:** `prisma/schema.prisma`
- **New:** `drizzle/schema.ts`

### 3. Database Connection
- **Old:** `lib/prisma.ts` (PrismaClient)
- **New:** `lib/db.ts` (Drizzle with postgres-js)

### 4. Service Files
All service files have been updated to use Drizzle:
- `services/user.service.ts`
- `services/template.service.ts`
- `services/download.service.ts`
- `services/payment.service.ts`
- `services/department.service.ts`

### 5. Library Files
- `lib/utils.ts` - Updated to use Drizzle
- `lib/auth.ts` - Updated to use Drizzle

## Installation

1. **Install new dependencies:**
   ```bash
   npm install
   ```

2. **Generate migrations:**
   ```bash
   npm run db:generate
   ```

3. **Push schema to database:**
   ```bash
   npm run db:push
   ```

## New Scripts

The package.json scripts have been updated:

- `db:generate` - Generates Drizzle migrations
- `db:push` - Pushes schema changes to database
- `db:migrate` - Runs migrations
- `db:studio` - Opens Drizzle Studio (replaces Prisma Studio)

## Key Differences

### Query Syntax

**Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

**Drizzle:**
```typescript
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)
```

### Insert

**Prisma:**
```typescript
const user = await prisma.user.create({
  data: { email, username, passwordHash }
})
```

**Drizzle:**
```typescript
const [user] = await db
  .insert(users)
  .values({ email, username, passwordHash })
  .returning()
```

### Update

**Prisma:**
```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: { isVerified: true }
})
```

**Drizzle:**
```typescript
const [user] = await db
  .update(users)
  .set({ isVerified: true })
  .where(eq(users.id, userId))
  .returning()
```

## Benefits of Drizzle

1. **Type Safety:** Full TypeScript support with inferred types
2. **Performance:** Lightweight and fast
3. **SQL-like:** More control over queries
4. **No Code Generation:** No need to run `generate` before building
5. **Better Tree-shaking:** Smaller bundle size

## Migration Notes

- All existing database tables remain unchanged
- No data migration needed
- All API endpoints continue to work the same way
- Type definitions are now exported from `drizzle/schema.ts`

## Troubleshooting

If you encounter issues:

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Regenerate schema:**
   ```bash
   npm run db:generate
   ```

3. **Check database connection:**
   Ensure `DATABASE_URL` is set correctly in `.env`

## Next Steps

1. Test all API endpoints
2. Verify database operations
3. Remove old Prisma files if desired:
   - `prisma/` directory (optional, can keep for reference)
   - Old test scripts using Prisma

