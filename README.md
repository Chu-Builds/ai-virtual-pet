# PawPal 🐾

> Your AI pet companion, always with you.

PawPal is an AI-powered virtual pet app built for the 8x Engineer AI Virtual Pet Companion challenge. Adopt a cat, dog, or bunny each with a distinct personality that evolves based on how you interact with it. Share your pet with a friend and raise it together in real time. 

Built with React Native, Supabase, and Llama 3.2 via OpenRouter, PawPal bridges the gap between classic virtual pets (like Tamagotchi) and modern Generative AI, creating a pet that genuinely remembers you, reacts to your care, and grows alongside you.

---

## 🌟 Key Features

- **Adopt a Unique Pet** — Choose between a cat, dog, or bunny. Each species comes with its own base prompt and behavioral quirks.
- **Dynamic AI Personality Engine** — Powered by Meta's Llama 3.2 (via OpenRouter), your pet's responses are fully contextual. If you haven't fed them, they'll act hungry or cranky. If you play with them often, they become affectionate. 
- **Memory & Pet Journal** — Every conversation is saved. A background process periodically summarizes these interactions to evolve the core "personality prompt" of your pet, giving them long-term memory.
- **Real-Time Co-parenting** — Invite a friend via email! By leveraging Supabase Realtime subscriptions and React Query cache invalidation, actions taken by one parent (like feeding or playing) instantly update on the other parent's screen.
- **Growth Stages** — Watch your pet grow! Pets transition from Baby → Teen → Adult based on interaction milestones and time spent together.
- **Stats Decay & Dashboard** — Monitor Hunger, Happiness, and Energy. These stats naturally decay over time. Neglecting your pet changes how the AI responds to your chats!

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **React Native & Expo**: Built using Expo for seamless cross-platform deployment (iOS, Android, and Web). 
- **UI & Styling**: Styled with NativeWind (TailwindCSS for React Native) and custom theming (`lib/theme.ts`) for a warm, premium user experience.
- **State Management**: `TanStack Query` (React Query) handles server state, caching, and optimistic UI updates for instant feedback during pet interactions.
- **Animations**: `React Native Animated` powers the breathing, bouncing, and interactive animations of the pet avatars.

### Backend & AI
- **Supabase**: 
  - **Auth**: Passwordless email authentication.
  - **Database**: PostgreSQL with Row Level Security (RLS). Stores users, pet profiles, stats, and chat logs.
  - **Real-time**: Supabase subscriptions ensure co-parents see updates simultaneously.
- **OpenRouter (AI)**: Utilizes `meta-llama/llama-3.2-3b-instruct:free` to generate fast, intelligent, and context-aware responses from the pet.

---

## 🚀 Setup Instructions

Follow these steps to run PawPal locally:

### 1. Clone & Install
```bash
git clone https://github.com/Chu-Builds/ai-virtual-pet.git
cd ai-virtual-pet
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Required keys:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key.
- `EXPO_PUBLIC_OPENROUTER_API_KEY`: Get a free key from OpenRouter.

### 3. Database Setup (Supabase)
1. Create a new Supabase project.
2. Go to the SQL Editor in your Supabase dashboard.
3. Run the migration scripts located in `supabase/migrations/` to set up the `profiles`, `pets`, `pet_stats`, and `interactions` tables.
4. Ensure Row Level Security (RLS) policies are enabled so users can only access their own pets (and pets they co-parent).

### 4. Run the App
```bash
npx expo start
```
- Press `i` to open the iOS simulator.
- Press `a` to open the Android emulator.
- Or scan the QR code with the Expo Go app on your physical device.

---

## 📂 AI Logs

As required by the hackathon rules, raw AI conversation logs demonstrating the prompt engineering and memory summarization features can be found in the `/ai-logs/` directory. Check out `session-01.md` to see how the AI reacts to different stat levels!

---

## 📬 Contact & Credits

Built by **Chu Builds** — chubuilds@gmail.com

*Built for the 8xEngineer AI Virtual Pet Companion Hackathon, May 2026*
