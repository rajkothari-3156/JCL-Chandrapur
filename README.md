# JCL Cricket Leaderboard

A modern web application to display cricket player performance statistics for the JCL Cricket League.

## Features

- 📊 View batting, bowling, fielding, and MVP leaderboards
- 📅 Toggle between 2023 and 2024 seasons
- 🎨 Beautiful, responsive UI with TailwindCSS
- ⚡ Fast performance with Next.js
- 🏆 Medal rankings for top 3 performers

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will automatically detect Next.js and deploy

## Data Structure

The app reads CSV files from the `/public/data` directory:
- `840910_*_leaderboard.csv` - 2023 season data
- `1243558_*_leaderboard.csv` - 2024 season data

Categories: batting, bowling, fielding, mvp

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse
