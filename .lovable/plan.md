

# 🌟 Intermittent Fasting Wellness App

A warm, motivational wellness companion that helps users track fasting, log meals, monitor weight, and gain health insights — all with user accounts so data syncs across devices.

---

## 1. User Authentication
- Sign up / log in with email and password
- User profile with name, avatar, and personal goals (target weight, preferred fasting schedule)
- Password reset flow

## 2. Dashboard (Home Screen)
- Active fasting timer with a large circular progress ring showing time remaining
- Motivational quotes that rotate daily
- Quick stats: current streak, total fasts completed, hours fasted this week
- Quick-start button to begin a fast

## 3. Fasting Timer
- Visual countdown timer with animated progress circle
- Support for preset schedules: **16:8**, **18:6**, **20:4 / OMAD**, and **Custom** windows
- Ability to set custom fasting/eating windows
- Start, pause, and end fast with optional notes
- Notifications when fasting window ends (browser notifications)

## 4. Fasting History & Stats
- Calendar view showing completed fasts
- Weekly/monthly charts showing fasting consistency
- Average fasting duration, longest fast, and streaks
- Filter and browse past fasts

## 5. Weight Tracker
- Log daily weight entries
- Line chart showing weight trend over time
- Set a goal weight with visual progress toward it

## 6. Meal Log
- Simple meal logger to record what you ate during eating windows
- Optional calorie/note field per entry
- Linked to the corresponding eating window

## 7. Health Insights
- Weekly summary card with encouragement and stats
- Trends: are you fasting more consistently? Is weight trending toward your goal?
- Badges and milestones (e.g., "7-day streak!", "100 hours fasted!")

## 8. Design & Feel
- **Warm color palette**: soft oranges, warm yellows, earthy tones
- Friendly rounded UI with encouraging micro-copy throughout
- Smooth animations on the timer and progress elements
- Mobile-responsive design that feels great on phones

## 9. Backend (Supabase)
- User accounts with profiles table
- Database tables for fasts, weight entries, and meal logs
- Row-level security so each user only sees their own data

