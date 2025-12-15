# Quick Fix: Database Connection Error

## The Problem
```
Can't reach database server at dpg-d4vb5mje5dus73ab29ug-a.oregon-postgres.render.com:5432
```

## ✅ Solution (Most Likely)

**Your Render.com database is probably PAUSED.**

### Steps to Fix:

1. **Go to Render.com Dashboard:**
   - Visit: https://dashboard.render.com
   - Login to your account

2. **Find Your Database:**
   - Look for your PostgreSQL database service
   - It should show status: **"Paused"** (red indicator)

3. **Resume the Database:**
   - Click on the database service
   - Click the **"Resume"** button (usually at the top right)
   - Wait 1-2 minutes for it to start

4. **Verify It's Running:**
   - Status should change to **"Running"** (green indicator)
   - You should see "Active" status

5. **Test Connection:**
   ```bash
   node scripts/test-connection.js
   ```
   Should show: `✅ Successfully connected to database!`

6. **Try Registration Again:**
   - Go back to your app
   - Try creating an account again
   - It should work now!

## Why This Happens

Render.com free tier databases automatically pause after 90 days of inactivity to save resources. This is normal behavior.

## Prevention

- **Option 1:** Keep database active by using it regularly
- **Option 2:** Upgrade to paid tier (databases don't pause)
- **Option 3:** Use local database for development

## Still Not Working?

If resuming doesn't work:

1. **Check Connection String:**
   - Go to Render.com database dashboard
   - Copy the **External Connection String**
   - Update your `.env` file with it
   - Make sure it ends with `?sslmode=require`

2. **Restart Your Dev Server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Check Network:**
   - Try from a different network
   - Check if firewall is blocking port 5432

## Need Help?

The error handling has been improved to show clearer messages. If you see a database error, it will now tell you exactly what to check.

