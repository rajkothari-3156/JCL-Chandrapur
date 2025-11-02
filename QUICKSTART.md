# Quick Start Guide

## 🎉 Your Cricket Leaderboard App is Ready!

The app is currently running at: **http://localhost:3000**

## What You Have

✅ Modern Next.js web application  
✅ Responsive design (mobile, tablet, desktop)  
✅ 2023 & 2024 season data loaded  
✅ 4 leaderboard categories (Batting, Bowling, Fielding, MVP)  
✅ Beautiful cricket-themed UI  
✅ All dependencies installed  
✅ Development server running  

## Quick Actions

### View the App
Open your browser to: http://localhost:3000

### Stop the Server
Press `Ctrl+C` in the terminal

### Restart the Server
```bash
cd /Users/rajkothari/jcl_2025/cricket-leaderboard
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

## Deploy to Vercel (5 minutes)

### Step 1: Create GitHub Repository
```bash
cd /Users/rajkothari/jcl_2025/cricket-leaderboard
git init
git add .
git commit -m "Cricket Leaderboard App"
```

### Step 2: Push to GitHub
1. Create a new repository on GitHub
2. Copy the repository URL
3. Run:
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your repository
5. Click "Deploy"
6. Done! Your app is live 🚀

## Features to Try

1. **Toggle Years**: Click "2023 Season" or "2024 Season"
2. **Switch Categories**: Click Batting, Bowling, Fielding, or MVP tabs
3. **View Rankings**: See top 20 players with medal emojis for top 3
4. **Hover Effects**: Hover over table rows for highlighting
5. **Responsive**: Try resizing your browser window

## File Structure

```
cricket-leaderboard/
├── app/                    # Next.js app directory
├── components/             # React components
├── public/data/           # CSV data files
├── package.json           # Dependencies
└── README.md             # Documentation
```

## Update Data

To update leaderboard data:
1. Replace CSV files in `public/data/`
2. Refresh the browser
3. New data appears instantly!

## Need Help?

- Check `README.md` for full documentation
- Check `DEPLOYMENT.md` for deployment guide
- Check `PROJECT_SUMMARY.md` for technical details

## Next Steps

1. ✅ View the app in your browser
2. ✅ Test different years and categories
3. 🚀 Deploy to Vercel
4. 🌐 Share your live URL!

---

**Enjoy your Cricket Leaderboard! 🏏**
