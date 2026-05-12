# PawPal 🐾

> Your AI pet companion, always with you.

PawPal is an AI-powered virtual pet app built for the 8x Engineer 
AI Virtual Pet Companion challenge. Adopt a cat, dog, or bunny — 
each with a distinct personality that evolves based on how you 
interact with it. Share your pet with a friend and raise it together 
in real time.

## Features

- **Adopt a pet** — choose from cat, dog, or bunny with unique AI personalities
- **Daily care** — feed, play, and talk to your pet; stats decay over time if neglected
- **AI personality engine** — mood-aware, memory-driven responses powered by OpenRouter (Llama 3.2)
- **Pet Journal** — every conversation saved as a memory; personality summary evolves over time
- **Growth stages** — Baby → Teen → Adult with visual changes at interaction milestones
- **Co-parenting** — invite a friend by email; real-time sync via Supabase subscriptions
- **Stats dashboard** — track interactions, days together, and growth progress

## Tech Stack

- React Native + Expo (based on 8xsocial/template-mobile)
- TypeScript
- Supabase (auth, database, real-time)
- TanStack Query
- OpenRouter API (meta-llama/llama-3.2-3b-instruct:free)
- React Native Animated

## Setup

1. Clone the repo
2. Run npm install
3. Copy .env.example to .env and fill in:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - EXPO_PUBLIC_OPENROUTER_API_KEY
4. Run migrations in Supabase SQL Editor (supabase/migrations/)
5. Run npx expo start

## AI Logs

AI conversation logs are in /ai-logs/ as required by the contest.

## Contact

Built by Chu Builds — chubuilds@gmail.com

---

*Built for the 8x Engineer AI Virtual Pet Companion Hackathon, May 2026*
