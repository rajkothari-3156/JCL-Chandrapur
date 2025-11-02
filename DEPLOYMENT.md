# Deployment Guide

## Deploy to Vercel (Recommended)

### Option 1: Deploy via GitHub

1. **Push to GitHub**
   ```bash
   cd /Users/rajkothari/jcl_2025/cricket-leaderboard
   git init
   git add .
   git commit -m "Initial commit: Cricket Leaderboard app"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js
   - Click "Deploy"
   - Your app will be live in minutes!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd /Users/rajkothari/jcl_2025/cricket-leaderboard
   vercel
   ```

3. **Follow the prompts**
   - Login to Vercel
   - Select your project settings
   - Deploy!

## Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the app**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

No environment variables are required for this app. All data is loaded from static CSV files.

## Custom Domain

After deployment, you can add a custom domain in your Vercel/Netlify dashboard:
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Updating Data

To update the leaderboard data:
1. Replace CSV files in `/public/data/` directory
2. Commit and push changes
3. Vercel will automatically redeploy

## Performance Tips

- CSV files are loaded on-demand (client-side)
- Consider moving to API routes for larger datasets
- Enable caching for better performance
- Use Vercel's Edge Network for global distribution
