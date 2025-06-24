# Bedtime Story Generator

Create magical, personalized bedtime stories for your little ones with AI-powered storytelling and beautiful illustrations.

---

## ✨ Features

- **Personalized Stories:**  
  Customize characters, settings, and moral lessons to create unique stories that resonate with your child.

- **Beautiful Illustrations:**  
  Each story comes with AI-generated illustrations that bring your tale to life with vibrant, child-friendly artwork.

- **Instant Creation:**  
  Generate complete stories in seconds and download them as beautifully formatted PDFs for bedtime reading.

- **User Accounts:**  
  Sign in with Google to save and revisit your favorite stories.

---

## 🚀 Getting Started

### 1. Clone the repo

```sh
git clone https://github.com/your-username/bedtime-story-generator.git
cd bedtime-story-generator
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

1. Copy the example environment file:
   ```sh
   cp .env.example .env
   ```
2. Open `.env` and fill in the required values:
   - `DATABASE_URL`: Your Postgres or Supabase connection string ([Supabase Project Settings](https://app.supabase.com/project/_/settings/database))
   - `FIREWORKS_API_KEY`: Get your API key from [Fireworks AI Dashboard](https://fireworks.ai/)
   - `NEXTAUTH_URL`: Usually `http://localhost:3000` for local development
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32` or use any random string
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: [Supabase API Settings](https://app.supabase.com/project/_/settings/api)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: [Google Cloud Console](https://console.developers.google.com/)

> **Tip:** See `.env.example` for all required variables and instructions.

### 4. Run database migrations

```sh
npx prisma migrate deploy
```

### 5. Start the development server

```sh
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **React 18**
- **Prisma** (PostgreSQL/Supabase)
- **NextAuth.js** (Google OAuth)
- **Fireworks AI** (LLMs & Stable Diffusion for text and image generation)
- **Tailwind CSS** (UI)
- **jsPDF** (PDF downloads)

---

## 🧪 Testing

- Unit, integration, and E2E tests with Jest and Playwright.
- To run tests:
  ```sh
  npm test
  # or for E2E
  npx playwright test
  ```

---

## 📦 Project Structure

- `/app` — Next.js app directory (pages, API routes)
- `/components` — React UI components
- `/lib` — Utility libraries (e.g., Supabase, Prisma)
- `/prisma` — Prisma schema and migrations

---

## 🙏 Acknowledgements

- [Fireworks AI](https://fireworks.ai/)
- [Supabase](https://supabase.com/)
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [jsPDF](https://github.com/parallax/jsPDF)

---

## 📄 License

MIT

---

**To get started, just copy `.env.example` to `.env`, fill in your keys, and follow the steps above!**
