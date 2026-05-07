# 🥘 Meal Prep Recipe Book

A personal recipe book web app that pairs with a physical binder. Paste any recipe URL → auto-imports it → appears on your site. Scan the QR code on the binder to pull up all recipes on your phone.

## How It Works

1. **Add recipes** at `/admin` — paste a URL from any recipe site
2. **Browse recipes** on the homepage — search, filter by tag
3. **QR code** on the homepage → print it and put it on your physical binder cover
4. Every time you add a recipe to the physical book, you paste the link in the admin panel

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin (password: mealprep2024)
```

---

## Deploy to Vercel (Free)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial recipe book"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/recipe-book.git
git push -u origin main
```

### 2. Import to Vercel
- Go to [vercel.com](https://vercel.com) → **Add New Project**
- Import your GitHub repo
- Framework: **Next.js** (auto-detected)
- Click **Deploy**

### 3. Set Up Vercel KV (for persistent storage)
- In Vercel dashboard → your project → **Storage** tab
- Create a **KV Database** (free tier: 256MB)
- Vercel auto-injects the `KV_*` environment variables
- Redeploy: `git push` or trigger redeploy in Vercel

### 4. Update Environment Variables
- Go to **Settings → Environment Variables**
- Add `ADMIN_PASSWORD` → your chosen password
- Add `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g., `https://recipe-book.vercel.app`)

### 5. Set Up Custom Domain (Optional)
- **Settings → Domains** → Add your domain
- Update DNS records as instructed

---

## The QR Code

After deploying, go to your site's homepage and click **📱 QR Code**. The QR links to your live site. Print it, cut it out, and stick it on the front of your physical recipe binder. Anyone with a phone can scan it to see all your recipes.

---

## Recipe URL Import

The app extracts recipe data from almost any recipe site using **JSON-LD structured data** (schema.org/Recipe). Most modern recipe sites (NYT Cooking, Bon Appétit, AllRecipes, Food Network, etc.) include this automatically.

If a site doesn't have structured data, the app falls back to basic HTML parsing, or you can add recipes manually.

---

## Adding Recipes Manually

At `/admin`, click **+ Add manually instead** to enter:
- Title
- Ingredients (one per line)
- Instructions (one per line)
- Tags (comma-separated: `breakfast, quick, vegetarian`)

---

## Recipe Tags

Tag recipes to filter them later:
- `breakfast` `lunch` `dinner` `snack` `dessert`
- `quick` `vegetarian` `chicken` `beef` `seafood`
- `pasta` `soup` `salad`
- Or any custom tag you want

---

## Project Structure

```
recipe-book/
├── data/
│   └── recipes.json          # Local storage (dev)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Public recipe book
│   │   ├── globals.css        # Tailwind + fonts
│   │   ├── admin/
│   │   │   └── page.tsx       # Admin panel
│   │   └── api/
│   │       └── recipes/
│   │           ├── route.ts   # GET (list) / POST (add)
│   │           └── [id]/
│   │               └── route.ts  # GET / DELETE
│   ├── components/
│   │   ├── RecipeCard.tsx     # Recipe display card
│   │   └── QrCode.tsx        # QR code component
│   └── lib/
│       ├── store.ts           # Data store (KV + local JSON)
│       └── scraper.ts         # Recipe URL scraper
└── package.json
```

---

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (styling)
- **Vercel KV** (persistent storage in production)
- **Cheerio** (HTML parsing for recipe scraping)
- **qrcode.react** (QR code generation)
