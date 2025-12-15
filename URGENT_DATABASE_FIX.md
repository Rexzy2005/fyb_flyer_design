# 🚨 URGENT: Database Connection Fix

## Current Error
```
Can't reach database server at dpg-d4vb5mje5dus73ab29ug-a.oregon-postgres.render.com:5432
POST /api/auth/register 503 (Service Unavailable)
```

## ⚡ IMMEDIATE ACTION REQUIRED

### Step 1: Check Render.com Database Status

1. **Go to:** https://dashboard.render.com
2. **Login** to your account
3. **Find** your PostgreSQL database service
4. **Check Status:**
   - If it says **"Paused"** → Click **"Resume"** button
   - If it says **"Running"** → Continue to Step 2

### Step 2: Wait for Database to Start

- After clicking Resume, wait **2-3 minutes**
- Status should change to **"Running"** (green)
- You'll see "Active" indicator

### Step 3: Restart Your Development Server

**IMPORTANT:** You MUST restart your dev server after database resumes:

```bash
# Stop the current server (Press Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 4: Test Connection

```bash
node scripts/test-connection.js
```

Expected output:
```
✅ Successfully connected to database!
✅ Database query successful!
📊 Tables found: 6
🎉 Database is ready!
```

### Step 5: Try Registration Again

- Go to your app
- Try creating an account
- Should work now!

## Why This Happens

Render.com **free tier** databases automatically **pause after 90 days of inactivity**. This is normal behavior to save resources.

## If Database is Already Running

If your database shows "Running" but you still get errors:

1. **Check Connection String:**
   - Go to Render.com database dashboard
   - Click "Connections" tab
   - Copy the **External Connection String**
   - Update your `.env` file:
     ```env
     DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
     ```
   - **IMPORTANT:** Must end with `?sslmode=require`

2. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Alternative: Use Local Database

If Render.com continues to have issues, use local PostgreSQL:

### Quick Setup with Docker:

```bash
docker run --name fyb-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fyb_university -p 5432:5432 -d postgres
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fyb_university?schema=public"
```

Then:
```bash
npm run db:push
npm run dev
```

## Prevention

To prevent database pausing:
- Use Render.com **paid tier** (databases don't pause)
- Or access database regularly to keep it active
- Or use local database for development

## Still Not Working?

1. **Check Render.com Logs:**
   - Go to database service
   - Click "Logs" tab
   - Look for errors

2. **Verify Network:**
   - Try from different network
   - Check firewall settings

3. **Contact Support:**
   - Render.com support if database issues persist
   - Check Render.com status page

---

**Most Common Fix:** Resume paused database + Restart dev server = ✅ Working!

