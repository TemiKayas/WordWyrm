# WordWyrm Deployment Guide for Vercel

## ✅ Pre-Deployment Checklist

### 1. Build Verification
- [x] Production build completes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] All routes compile correctly
- [x] Middleware compiles (86.3 kB)

### 2. Environment Variables Required

You must set these in your Vercel project settings:

#### **Database (Required)**
```bash
DATABASE_URL="postgresql://..."
# Get from: Vercel Postgres/Neon dashboard
```

#### **Blob Storage (Required)**
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
# Get from: Vercel Blob dashboard
```

#### **Authentication (Required)**
```bash
NEXTAUTH_URL="https://your-app.vercel.app"
# IMPORTANT: Use your production URL, not localhost!

NEXTAUTH_SECRET="..."
# Generate with: openssl rand -base64 32
```

#### **AI Service (Required)**
```bash
GEMINI_API_KEY="..."
# Get from: https://aistudio.google.com/app/apikey
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables (see above)
   - Set for: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to link project and set environment variables
```

## 🔧 Post-Deployment Configuration

### 1. Update NEXTAUTH_URL in Vercel

After first deployment, you'll get a URL like:
```
https://word-wyrm-xyz.vercel.app
```

**Update the environment variable:**
1. Go to Project Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. Set value to: `https://word-wyrm-xyz.vercel.app`
4. Redeploy: `vercel --prod` or trigger redeploy in dashboard

### 2. Run Database Migrations

If you made schema changes:

```bash
# Option A: Use Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option B: Add to build command in vercel.json (see below)
```

### 3. Verify Deployment

Check these URLs after deployment:
- ✅ Homepage: `https://your-app.vercel.app/`
- ✅ Login: `https://your-app.vercel.app/login`
- ✅ API: `https://your-app.vercel.app/api/auth/session`

## 📋 Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution:** Clear build cache and redeploy
```bash
# In Vercel Dashboard
Settings → General → Clear Cache & Redeploy
```

### Issue: Database connection errors
**Solution:** Verify DATABASE_URL is correct and uses pooled connection
- Make sure `?sslmode=require` is appended
- Use pooled connection for Prisma

### Issue: Auth redirects not working
**Solution:** Check NEXTAUTH_URL matches your production domain
- No trailing slash
- Must be HTTPS in production
- Must match your actual Vercel URL

### Issue: Gemini API errors
**Solution:** Verify API key and check quotas
- Key is valid at https://aistudio.google.com/app/apikey
- Check quota limits haven't been exceeded

### Issue: PDF upload fails
**Solution:** Check BLOB_READ_WRITE_TOKEN
- Token has write permissions
- Blob store is properly configured in Vercel

## ⚙️ Optional: vercel.json Configuration

Create `vercel.json` in project root for advanced configuration:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://your-app.vercel.app"
  },
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**What this does:**
- Runs Prisma migrations on build
- Sets deployment region (iad1 = US East)
- Increases timeout for API routes to 60s (needed for AI generation)

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Or in Dashboard
Project → Deployments → [Latest] → Runtime Logs
```

### Performance Monitoring
- Enable Vercel Analytics in Project Settings
- Monitor Response Times, Error Rates
- Check Function Execution Time

## 🔒 Security Checklist

- [ ] NEXTAUTH_SECRET is unique and secure (not the example value)
- [ ] Database credentials use environment variables
- [ ] API keys not committed to git (.env in .gitignore)
- [ ] Production NEXTAUTH_URL uses HTTPS
- [ ] CORS configured if needed (currently not required)
- [ ] Rate limiting considered for AI endpoints (future)

## 📦 Build Output Summary

Current production build stats:
```
Route (app)                                 Size  First Load JS
├ ○ /                                     2.4 kB         113 kB
├ ○ /login                               2.28 kB         113 kB
├ ○ /signup                              2.51 kB         113 kB
├ ○ /teacher/dashboard                   5.85 kB         119 kB
├ ○ /teacher/games/edit                  3.94 kB         117 kB
├ ○ /teacher/upload                      3.41 kB         116 kB
└ ƒ Middleware                           86.3 kB

○  Static  ✅ Pre-rendered
ƒ  Dynamic ✅ Server-rendered on demand
```

**Bundle sizes are good:**
- First Load JS: ~102-119 kB (within recommended limits)
- Middleware: 86.3 kB (acceptable for auth + routing)

## 🎯 Deployment Success Criteria

Your deployment is successful when:
1. ✅ Build completes without errors
2. ✅ All pages load (/, /login, /signup, /teacher/dashboard)
3. ✅ Users can sign up and log in
4. ✅ Teachers can upload PDFs
5. ✅ Games can be created and edited
6. ✅ Students can join games via share code
7. ✅ No errors in Runtime Logs

## 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production:** When you push to `main` branch
- **Preview:** For all pull requests and other branches

To disable auto-deploy:
- Project Settings → Git → Disable "Auto Deploy"

## 📞 Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Deployment](https://authjs.dev/getting-started/deployment)

---

**Last Updated:** October 31, 2025
**Build Version:** Next.js 15.5.5
**Node Version:** 20.x (recommended)
