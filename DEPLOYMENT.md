# Free Backend Deployment Guide

This guide covers deploying your AppartManage backend to free hosting platforms.

## 🎯 Recommended Free Platforms

### 1. **Render** (Best Choice - Easiest Setup)
- ✅ **Free tier**: 750 hours/month (enough for 24/7)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificate
- ✅ Environment variables support
- ⚠️ **Limitation**: Free tier spins down after 15 minutes of inactivity (takes ~30s to wake up)

### 2. **Railway**
- ✅ **Free tier**: $5 credit/month
- ✅ Auto-deploy from GitHub
- ✅ No sleep (always on)
- ⚠️ **Limitation**: Limited to $5 worth of usage per month

### 3. **Fly.io**
- ✅ **Free tier**: 3 shared VMs
- ✅ Global edge deployment
- ✅ No sleep
- ⚠️ **Limitation**: Requires credit card (but won't charge on free tier)

---

## 🚀 Deployment Steps for Render (Recommended)

### Step 1: Prepare Your Repository

1. **Ensure your code is pushed to GitHub**
   ```bash
   cd AppartManage-backend
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free)
3. No credit card required for free tier

### Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (`AppartManage-Backend`)
3. Configure:
   - **Name**: `appartmanage-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 4: Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
NODE_ENV=production
PORT=10000
FIREBASE_PROJECT_ID=appartmanage
FIREBASE_SERVICE_ACCOUNT_JSON=<paste your entire service account JSON here>
ALLOWED_ORIGINS=https://your-frontend-domain.com,exp://192.168.*
```

**To get Firebase Service Account JSON:**
1. Open your Firebase service account JSON file (e.g., `secrets/appartmanage-firebase-adminsdk.json`)
2. Copy the entire JSON content
3. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT_JSON` (Render will handle it securely)

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Run `npm install`
   - Start your app with `npm start`
3. Wait for deployment (2-3 minutes)
4. Your backend will be available at: `https://appartmanage-backend.onrender.com`

### Step 6: Update Frontend

Update your frontend `.env.production` file:
```
EXPO_PUBLIC_BACKEND_URL=https://appartmanage-backend.onrender.com
EXPO_PUBLIC_NOTIFICATION_API_URL=https://appartmanage-backend.onrender.com
```

---

## 🚂 Deployment Steps for Railway

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Requires credit card (but won't charge on free tier)

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `AppartManage-Backend` repository

### Step 3: Configure Environment Variables

Go to **Variables** tab and add:
```
NODE_ENV=production
PORT=4000
FIREBASE_PROJECT_ID=appartmanage
FIREBASE_SERVICE_ACCOUNT_JSON=<paste JSON>
ALLOWED_ORIGINS=https://your-frontend-domain.com,exp://192.168.*
```

### Step 4: Deploy

Railway auto-detects Node.js and deploys automatically. Your URL will be: `https://appartmanage-backend-production.up.railway.app`

---

## ✈️ Deployment Steps for Fly.io

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login

```bash
fly auth login
```

### Step 3: Initialize Fly App

```bash
cd AppartManage-backend
fly launch
```

Follow prompts (select free plan).

### Step 4: Set Secrets

```bash
fly secrets set FIREBASE_SERVICE_ACCOUNT_JSON="$(cat secrets/appartmanage-firebase-adminsdk.json)"
fly secrets set FIREBASE_PROJECT_ID=appartmanage
fly secrets set NODE_ENV=production
fly secrets set ALLOWED_ORIGINS="https://your-frontend-domain.com,exp://192.168.*"
```

### Step 5: Deploy

```bash
fly deploy
```

---

## 📝 Important Notes

### Firebase Service Account

Your backend needs Firebase Admin SDK credentials. You have two options:

**Option 1: Environment Variable (Recommended)**
- Set `FIREBASE_SERVICE_ACCOUNT_JSON` with the entire JSON content
- Most secure and works on all platforms

**Option 2: File Path**
- Upload the JSON file to the server
- Set `FIREBASE_SERVICE_ACCOUNT_PATH` to the file path
- Less secure, not recommended

### CORS Configuration

Update `ALLOWED_ORIGINS` to include:
- Your production frontend URL
- Your Expo development URLs (if needed)
- Wildcard patterns like `exp://192.168.*` for local testing

### Port Configuration

- **Render**: Uses port `10000` (set via PORT env var)
- **Railway**: Uses port from `PORT` env var or auto-assigned
- **Fly.io**: Uses port `8080` by default (can be configured)

### Health Check Endpoint

Your backend already has a `/health` endpoint at `/api/health` (if implemented) or you can use the root endpoint.

---

## 🔧 Troubleshooting

### App goes to sleep (Render free tier)
- First request after sleep takes ~30 seconds
- Consider Railway or Fly.io for always-on service
- Or upgrade Render plan ($7/month)

### Firebase connection errors
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
- Check `FIREBASE_PROJECT_ID` matches your Firebase project
- Ensure service account has proper permissions

### CORS errors
- Update `ALLOWED_ORIGINS` with your frontend URL
- Check that your frontend is using the correct backend URL

---

## 📊 Comparison Table

| Platform | Free Tier | Always On | Setup Difficulty | Best For |
|----------|-----------|-----------|------------------|----------|
| **Render** | 750 hrs/month | ❌ Sleeps after 15min | ⭐ Easy | Development/Testing |
| **Railway** | $5/month credit | ✅ Yes | ⭐⭐ Medium | Production |
| **Fly.io** | 3 VMs | ✅ Yes | ⭐⭐⭐ Harder | Production (Global) |

---

## 🎯 Recommendation

**For Production**: Use **Railway** or **Fly.io** (always-on, no sleep)
**For Development/Testing**: Use **Render** (easiest setup, free tier sufficient)

Start with Render to test, then migrate to Railway/Fly.io for production.

