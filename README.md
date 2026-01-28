# Pathlight - Fixed Deployment (With Working API)

## 🎯 What Changed

The previous version had CORS errors because it called Anthropic API directly from the browser.

**This version fixes that** by adding a serverless function that acts as a proxy.

---

## 🚀 Deploy (15 Minutes - For Real This Time)

### Step 1: Upload to GitHub

1. Go to https://github.com
2. Create new repository: `pathlight`
3. Upload ALL files from this folder
4. Commit changes

### Step 2: Get Your Anthropic API Key

(You already did this - use the same key)

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Import Project"**
4. Select `pathlight` repository
5. Click **"Import"**

**CRITICAL - Add Environment Variable:**
- Click **"Environment Variables"**
- Name: `ANTHROPIC_API_KEY`
- Value: [paste your API key]
- Click **"Add"**

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. **DONE!**

---

## ✅ What's Fixed

**The Problem:**
- Browser → Anthropic API = CORS error ❌

**The Solution:**
- Browser → Vercel Function → Anthropic API = Works ✅

**Files added:**
- `/pages/api/claude.js` - Serverless function that proxies API calls

---

## 💰 Costs

**Vercel Hosting:** $0 (free tier)
**Serverless Function Calls:** $0 (free tier covers 100,000 calls/month)
**Anthropic API:** ~$0.08 per user (uses your $5 credits)

**For 50 users:** ~$4 total

---

## 🧪 Testing

After deployment:

1. Open your Vercel URL
2. Go through the journey yourself first
3. Check browser console (F12) for errors
4. Make sure AI responses work
5. Complete the synthesis
6. If it works → share with friends!

---

## 📱 Share With Friends

```
Testing a career clarity tool. Takes 20 mins, gives you personalized 
role suggestions. Honest feedback appreciated!

[your-url].vercel.app
```

---

## 🐛 Troubleshooting

**"API key not valid"**
- Go to Vercel → Settings → Environment Variables
- Make sure `ANTHROPIC_API_KEY` is set correctly
- Redeploy

**"Failed to fetch"**
- Check Vercel function logs: Vercel dashboard → Functions
- Make sure `/api/claude` endpoint exists

**AI responses not appearing**
- Open browser console (F12)
- Look for error messages
- Check Network tab for failed requests

---

## 🎉 It Should Work Now!

This version has a proper backend that handles API calls securely.

No more CORS errors.
No more "Failed to fetch".

**Just works.** ✨

Good luck!
