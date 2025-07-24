# 🚀 ADFD Tracking System - Deployment Guide

## 📋 Prerequisites

1. **Supabase Project** - Already configured ✅
2. **GitHub Repository** - Already set up ✅
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

## 🔧 Environment Variables

Your Supabase configuration (from `src/lib/supabase.ts`):
```
REACT_APP_SUPABASE_URL=https://dxrqbjuckrhkzrsdbenp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cnFianVja3Joa3pyc2RiZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODYwOTMsImV4cCI6MjA2ODY2MjA5M30.awjOetr7d9oMnhTCShz3ilWFLwOB0DAhrIwa7xJV7v4
```

## 🚀 Deploy to Vercel

### Option 1: One-Click Deploy (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `Mitty530/ADFD_Tracking_System`
3. Configure environment variables:
   - `REACT_APP_SUPABASE_URL` = `https://dxrqbjuckrhkzrsdbenp.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cnFianVja3Joa3pyc2RiZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODYwOTMsImV4cCI6MjA2ODY2MjA5M30.awjOetr7d9oMnhTCShz3ilWFLwOB0DAhrIwa7xJV7v4`
4. Click **Deploy**

### Option 2: CLI Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY

# Redeploy with environment variables
vercel --prod
```

## 🔒 Security Notes

- ✅ **Anon Key is Safe**: The anon key is designed to be public
- ✅ **RLS Enabled**: Row Level Security protects your data
- ✅ **Domain Validation**: Only @adfd.ae emails can access
- ✅ **Authorized Users**: Additional user validation in place

## 🌐 Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain (e.g., `tracking.adfd.ae`)
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## 📱 Post-Deployment Checklist

- [ ] Test login with authorized email
- [ ] Verify magic link emails are received
- [ ] Check dashboard functionality
- [ ] Test on mobile devices
- [ ] Confirm all authorized users can access

## 🔧 Troubleshooting

**Build Errors:**
- Check environment variables are set correctly
- Ensure all dependencies are in package.json

**Authentication Issues:**
- Verify Supabase URL and key
- Check email domain validation
- Confirm user is in authorized list

**Email Delivery:**
- Check spam folder
- Verify Supabase email settings
- Test with different email providers

## 📞 Support

For deployment issues, contact the system administrator or check:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
