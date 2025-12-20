# SkillAntra v0

A campus-first skill and project collaboration platform built with Next.js 15+, Supabase, and Tailwind CSS.

## Features

- **Authentication**: Email/password signup and login with persistent sessions
- **User Profiles**: Create and edit profiles with name, bio, and skills
- **Collaboration Requests**: Send, view, and manage collaboration requests between users
- **Profile Browsing**: Discover and view other users' profiles

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Settings > API
   - Copy your service role key from Settings > API (keep this secret!)

3. **Configure environment variables**:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

4. **Set up the database**:
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the SQL from `supabase-migration.sql` to create tables and RLS policies

5. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (app)/             # Protected app pages (dashboard, profiles, requests)
│   └── api/               # API routes for mutations
├── components/            # Reusable React components
├── lib/                   # Utilities and Supabase clients
│   ├── supabase/         # Supabase client setup (browser & server)
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Helper functions
└── globals.css           # Global styles

middleware.ts             # Next.js middleware for auth
supabase-migration.sql    # Database schema and RLS policies
```

## Database Schema

### Profiles
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `name` (TEXT, Required)
- `bio` (TEXT, Optional)
- `skills` (TEXT, Comma-separated)
- `created_at`, `updated_at` (Timestamps)

### Collaboration Requests
- `id` (UUID, Primary Key)
- `sender_id` (UUID, Foreign Key to profiles)
- `receiver_id` (UUID, Foreign Key to profiles)
- `status` (TEXT: pending/accepted/rejected)
- `message` (TEXT, Optional)
- `created_at`, `responded_at` (Timestamps)

## Row-Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow public read access to profiles
- Restrict profile updates to the owner
- Restrict collaboration request access to sender/receiver only
- Prevent unauthorized mutations

## Deployment

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

Private - All rights reserved
