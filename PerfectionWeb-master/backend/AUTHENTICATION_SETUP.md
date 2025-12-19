# Parent Authentication Setup Guide

This guide explains how parent authentication works with phone numbers and default passwords.

## How It Works

1. **Default Password**: All parents have a default password of `123456`
2. **First-Time Login**: When a parent logs in for the first time, they must change their password
3. **Phone Number as Username**: Parents use their phone number (from Excel Parent No. column) as their username
4. **Automatic Account Creation**: When you upload Excel files, parent accounts are automatically created

## Database Setup

### Step 1: Create Parents Table

Run the SQL script `parents_schema.sql` in your Supabase SQL Editor:

```sql
-- This creates the parents table for authentication
CREATE TABLE IF NOT EXISTS parents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    needs_password_reset BOOLEAN DEFAULT TRUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

### Step 2: Verify Table Creation

Check that the `parents` table exists in your Supabase dashboard.

## How Parent Accounts Are Created

When you upload an Excel file:

1. The system extracts `parent_no` from each student record
2. For each unique parent phone number, it creates a parent account with:
   - **Phone Number**: The parent's phone number from Excel
   - **Password**: `123456` (default)
   - **needs_password_reset**: `true` (first-time login flag)
   - **Name**: Student's name (or "Parent {phone_number}")

## Login Flow

### First-Time Login

1. Parent enters their phone number (from Excel)
2. Parent enters default password: `123456`
3. System authenticates and redirects to password reset page
4. Parent sets a new password (minimum 6 characters)
5. Parent is redirected to their dashboard

### Subsequent Logins

1. Parent enters their phone number
2. Parent enters their custom password
3. Parent is redirected directly to their dashboard

## Testing Authentication

### Test with a Parent Account

1. Upload an Excel file with parent phone numbers
2. Try logging in with:
   - **Phone Number**: Any phone number from your Excel file
   - **Password**: `123456`
3. You should be redirected to the password reset page
4. Set a new password
5. Log out and log back in with the new password

### Example Phone Numbers

From your Excel files, parent phone numbers might look like:
- `1272030433`
- `1005451745`
- `1222599864`
- `1010575516`

Enter these exactly as they appear in the Excel file (without spaces or dashes).

## API Endpoints

### Login
```
POST /api/auth/login
Body: {
  "phone_number": "01234567890",
  "password": "123456"
}
```

### Reset Password
```
POST /api/auth/reset-password
Body: {
  "phone_number": "01234567890",
  "new_password": "newpassword123"
}
```

## Security Notes

⚠️ **Important**: The current implementation stores passwords in plain text for simplicity. In production, you should:

1. Use proper password hashing (bcrypt, argon2, etc.)
2. Implement password strength requirements
3. Add rate limiting for login attempts
4. Implement session tokens/JWT
5. Add password reset via email/SMS

## Troubleshooting

### "Invalid phone number or password"

- Check that the phone number matches exactly what's in the Excel file
- Ensure the default password is `123456`
- Verify the parent account was created (check Supabase `parents` table)

### "Parent not found" when resetting password

- Make sure you're logged in first
- Check that the phone number in the request matches the logged-in user

### Parent account not created after Excel upload

- Check Flask backend logs for errors
- Verify Supabase connection is working
- Check that `parent_no` column exists in your Excel file

## Next Steps

1. Run `parents_schema.sql` in Supabase
2. Upload an Excel file to create parent accounts
3. Test login with a parent phone number
4. Verify password reset flow works
5. Test subsequent logins with new password

Your authentication system is now ready! 🎉

