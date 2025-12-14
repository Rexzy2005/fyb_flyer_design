# Database Connection Troubleshooting Guide

## Current Issue

**Error:** `P1001: Can't reach database server`

This means Prisma cannot establish a connection to your PostgreSQL database.

## Common Causes & Solutions

### 1. Database is Paused (Most Common for Render.com)

**Problem:** Render.com free tier databases pause after 90 days of inactivity.

**Solution:**
1. Go to https://dashboard.render.com
2. Find your PostgreSQL database
3. If it shows "Paused", click the "Resume" button
4. Wait 1-2 minutes for the database to start
5. Try connecting again

### 2. Connection String Format

**Required Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**For Render.com specifically:**
- Must include `?sslmode=require` at the end
- Port is usually `5432`
- Host format: `dpg-xxxxx-a.oregon-postgres.render.com`

**Example:**
```env
DATABASE_URL="postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/dbname?sslmode=require"
```

### 3. Network/Firewall Issues

**Problem:** Your network or firewall might be blocking the connection.

**Solutions:**
- Try from a different network
- Check if your firewall allows outbound connections on port 5432
- Try using a VPN
- Check if your ISP blocks database connections

### 4. Wrong Credentials

**Problem:** Username or password in connection string is incorrect.

**Solution:**
1. Go to Render.com dashboard
2. Click on your database
3. Go to "Connections" tab
4. Copy the "Internal Database URL" or "External Connection String"
5. Update your `.env` file with the correct credentials

### 5. Database Not Whitelisted

**Problem:** Some database providers require IP whitelisting.

**Solution:**
1. Check Render.com database settings
2. Look for "IP Whitelist" or "Allowed IPs"
3. Add your current IP address
4. Or use "Allow all IPs" for development

## Testing Connection

### Method 1: Using Prisma CLI

```bash
# Test connection
npx prisma db pull

# Or try to push schema
npm run db:push
```

### Method 2: Using Test Script

```bash
node scripts/test-connection.js
```

### Method 3: Using pgAdmin or DBeaver

1. Download pgAdmin or DBeaver
2. Create new PostgreSQL connection
3. Use credentials from your `.env` file
4. Test connection

## Connection String Examples

### Render.com (External)
```env
DATABASE_URL="postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/dbname?sslmode=require"
```

### Render.com (Internal - if on same network)
```env
DATABASE_URL="postgresql://user:password@dpg-xxxxx-a:5432/dbname?sslmode=require"
```

### Local PostgreSQL
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fyb_university?schema=public"
```

### Supabase
```env
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

## Quick Diagnostic Steps

1. **Check if database is running:**
   ```bash
   # Run test script
   node scripts/test-connection.js
   ```

2. **Verify .env file:**
   - Ensure `.env` file exists in project root
   - Check `DATABASE_URL` is set
   - Verify no extra spaces or quotes

3. **Check Render.com status:**
   - Dashboard shows "Running" (not "Paused")
   - No error messages in logs
   - Connection string is correct

4. **Test with different tool:**
   - Try connecting with pgAdmin
   - Or use `psql` command line tool

## Alternative: Use Local Database for Development

If Render.com continues to have issues, you can use a local PostgreSQL:

1. **Install PostgreSQL locally:**
   - Windows: Download from postgresql.org
   - Or use Docker: `docker run -e POSTGRES_PASSWORD=password -p 5432:5432 postgres`

2. **Update .env:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/fyb_university?schema=public"
   ```

3. **Create database:**
   ```sql
   CREATE DATABASE fyb_university;
   ```

4. **Push schema:**
   ```bash
   npm run db:push
   ```

## Still Having Issues?

1. Check Render.com database logs for errors
2. Verify your account hasn't exceeded free tier limits
3. Try creating a new database on Render.com
4. Consider using Supabase or Neon (free PostgreSQL alternatives)
5. Check Prisma documentation: https://www.prisma.io/docs/guides/connection-issues

## Next Steps After Connection Works

Once connection is established:

```bash
# Push schema to database
npm run db:push

# Open Prisma Studio to view data
npm run db:studio

# Start development server
npm run dev
```

