# Database Connection Error - Fix Guide

## Error Message
```
Can't reach database server at dpg-d4vb5mje5dus73ab29ug-a.oregon-postgres.render.com:5432
```

## Quick Fix Steps

### 1. Check Render.com Database Status

**Most Common Issue: Database is Paused**

Render.com free tier databases automatically pause after 90 days of inactivity.

**Solution:**
1. Go to https://dashboard.render.com
2. Find your PostgreSQL database service
3. If it shows "Paused" status, click the **"Resume"** button
4. Wait 1-2 minutes for the database to start
5. Try your registration again

### 2. Verify Connection String

Check your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@dpg-d4vb5mje5dus73ab29ug-a.oregon-postgres.render.com:5432/dbname?sslmode=require"
```

**Important:** 
- Must include `?sslmode=require` at the end
- Check if you're using the **External Connection String** (not Internal)
- Verify username and password are correct

### 3. Test Connection

Run this command to test your database connection:

```bash
npm run db:push
```

If it works, your database is connected. If not, continue troubleshooting.

### 4. Alternative: Use Local Database for Development

If Render.com continues to have issues, you can use a local PostgreSQL:

**Option A: Install PostgreSQL Locally**
1. Download from https://www.postgresql.org/download/
2. Install and create a database
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/fyb_university?schema=public"
   ```

**Option B: Use Docker**
```bash
docker run --name fyb-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fyb_university -p 5432:5432 -d postgres
```

Then update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fyb_university?schema=public"
```

### 5. Check Network/Firewall

- Ensure your firewall allows outbound connections on port 5432
- Try from a different network
- Check if your ISP blocks database connections

## After Fixing

Once your database is connected:

1. **Push schema:**
   ```bash
   npm run db:push
   ```

2. **Verify tables exist:**
   ```bash
   npm run db:studio
   ```
   This opens Prisma Studio where you can see your tables

3. **Test registration:**
   - Try creating an account again
   - Check server logs for success messages
   - Verify user appears in database

## Error Handling

The application now has better error handling:
- Clear error messages for database connection issues
- Helpful suggestions in error responses
- Console logging for debugging

## Still Having Issues?

1. **Check Render.com Logs:**
   - Go to your database service
   - Check the "Logs" tab for errors

2. **Verify Database URL:**
   - Copy the connection string directly from Render.com dashboard
   - Make sure it's the External Connection String

3. **Contact Support:**
   - Render.com support if database issues persist
   - Check Render.com status page for outages

## Prevention

To prevent database pausing:
- Use Render.com paid tier (databases don't pause)
- Or regularly access your database to keep it active
- Or use a local database for development

