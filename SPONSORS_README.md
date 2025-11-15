# How to Add Sponsor Logos

## Sponsor Categories

JCL Chandrapur has 9 sponsor categories, each with specific logo requirements:

1. **Title Sponsor** - 800x400px (Premium placement on all pages)
2. **Co-Sponsor** - 600x300px 
3. **Food Sponsor** - 500x250px
4. **Hospitality Sponsor** - 500x250px
5. **Presentation Sponsor** - 500x250px
6. **Water Bottle Sponsor** - 500x250px
7. **Media Partner** - 500x250px
8. **Entry Gate Sponsor** - 500x250px
9. **Event Partners** - 400x200px

## Quick Setup Guide

### 1. Prepare Your Logo Files

**General Requirements:**
- Format: PNG with transparent background (or SVG)
- High resolution (2x for retina displays recommended)
- All logos should be in 2:1 aspect ratio
- File naming: Use lowercase with hyphens

### 2. Add Logos to Project

1. Place your logo files in the public/sponsors directory:
   ```
   public/
   └── sponsors/
       ├── title-sponsor.png
       ├── co-sponsor.png
       ├── food-sponsor.png
       ├── hospitality-sponsor.png
       ├── presentation-sponsor.png
       ├── water-bottle-sponsor.png
       ├── media-partner.png
       ├── entry-gate-sponsor.png
       └── event-partners.png
   ```

### 3. Update SponsorsBar Component

Edit `components/layout/SponsorsBar.tsx`:

**For Title Sponsor:**
Replace line 33-36 with:
```tsx
<img 
  src="/sponsors/title-sponsor.png" 
  alt="Title Sponsor Name"
  className="w-full h-full object-contain"
/>
```

**For Co-Sponsors:**
Replace line 68-69 in the map function with:
```tsx
<img 
  src={`/sponsors/co-sponsor-${index}.png`}
  alt={`Co-Sponsor ${index}`}
  className="w-full h-full object-contain"
/>
```

### 4. Update Sponsors Page

Edit `app/sponsors/page.tsx`:

**For Title Sponsor (line 33-38):**
```tsx
<img 
  src="/sponsors/title-sponsor.png" 
  alt="Title Sponsor Name"
  className="w-full h-full object-contain p-4"
/>
```

**For Co-Sponsors (line 70-73):**
```tsx
<img 
  src={`/sponsors/co-sponsor-${index}.png`}
  alt={`Co-Sponsor ${index}`}
  className="w-full h-full object-contain"
/>
```

### 5. Add Sponsor Links (Optional)

Wrap logos in anchor tags to make them clickable:

```tsx
<a href="https://sponsor-website.com" target="_blank" rel="noopener noreferrer">
  <img src="/sponsors/title-sponsor.png" alt="Sponsor Name" />
</a>
```

## Tips for Best Results

1. **High Quality**: Use high-resolution images that scale well
2. **Transparent Backgrounds**: PNG files with transparency look most professional
3. **Consistent Sizing**: Keep aspect ratios consistent across all logos
4. **Optimize Files**: Compress images to reduce load times (use TinyPNG or similar)
5. **Test Responsiveness**: Check how logos look on mobile and desktop

## Sponsor Information

You can also add sponsor descriptions and links by creating a configuration file:

Create `public/sponsors/config.json`:
```json
{
  "titleSponsor": {
    "name": "Company Name",
    "logo": "/sponsors/title-sponsor.png",
    "website": "https://example.com",
    "description": "Supporting local cricket since 2020"
  },
  "coSponsors": [
    {
      "name": "Co-Sponsor 1",
      "logo": "/sponsors/co-sponsor-1.png",
      "website": "https://example1.com"
    },
    {
      "name": "Co-Sponsor 2",
      "logo": "/sponsors/co-sponsor-2.png",
      "website": "https://example2.com"
    }
  ]
}
```

Then import and use this data in your components dynamically.
