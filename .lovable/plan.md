

# Massive Platform Upgrade Plan

## Payments Setup (Battle Pass Monetization)

For accepting real money on your Battle Pass, I recommend **Paddle** as your payment provider. Paddle acts as Merchant of Record, meaning it handles all taxes, compliance, invoicing, and receipts globally — you get paid directly by Paddle. The fee is 5% + 50¢ per transaction.

**How you get paid**: Paddle collects money from players, handles all tax/compliance, then pays you on a regular schedule to your bank account. You'll set up a Paddle account during the verification step.

A test environment will be created first so you can test without real money. Going live requires Paddle verification.

## Implementation Batches

Given the massive scope, here's how we'll tackle this across multiple rounds:

---

### Batch 1: Admin Analytics Dashboard (this round)

1. **Analytics Overview Tab** — Charts for daily active users, revenue, games played over time
2. **User Growth Chart** — Line chart showing signups over days/weeks
3. **Revenue Dashboard** — Track Battle Pass purchases, coin/gem spending
4. **Game Popularity Rankings** — Bar chart of most-played games
5. **Real-time Active Users** — Live counter with trend indicators
6. **Economy Health Monitor** — Coins/gems minted vs spent ratios
7. **User Retention Metrics** — Day 1, 7, 30 retention stats
8. **Engagement Heatmap** — Peak playing hours visualization
9. **Bug Report Dashboard** — Aggregated bug report stats with status tracking
10. **Export Reports** — CSV/JSON download of analytics data
11. **Admin Activity Audit Log** — Detailed log of all admin actions
12. **Content Management** — Manage announcements, news, featured games from admin
13. **User Detail View** — Click into any user to see full profile, stats, history
14. **Bulk Actions** — Mass email, mass coin grants, mass bans
15. **System Health Dashboard** — Database size, edge function performance, error rates
16. **Configurable Dashboard Widgets** — Drag/reorder admin dashboard cards
17. **Admin Notifications** — Alerts for unusual activity (spike in reports, etc.)
18. **Game Config Panel** — Per-game difficulty settings, enable/disable individual games
19. **Scheduled Maintenance** — Set future maintenance windows with countdown
20. **Admin Search** — Global search across users, games, reports

---

### Batch 2: Battle Pass & Payments

- Enable Paddle payments
- Create Battle Pass product with pricing
- Build premium Battle Pass purchase flow
- Implement tier unlocking with real rewards
- Webhook handler for payment confirmation

### Batch 3: Social & Multiplayer

- Global chat system, game-specific chat rooms
- Clan/guild creation and management (new DB tables)
- Follower system
- Party lobby mode
- PvP rooms for Chess/Connect Four
- Tournament bracket system

### Batch 4: Progression & Economy

- Crafting system for cosmetics
- Quest system overhaul with daily/weekly/seasonal quests
- Prestige system with permanent multipliers

### Batch 5: UX & Polish

- Theme engine (Cyberpunk, Retro, Ocean themes)
- Animated game thumbnails on hover
- Site-wide sound system with ambient music
- Guided onboarding tutorial for new users
- PWA support for mobile installation
- Push notifications
- i18n multi-language support

---

## Technical Details

### Batch 1 Implementation

**New component**: `src/components/AdminAnalytics.tsx` — A comprehensive analytics dashboard using recharts (already available) with:
- `AreaChart` for user growth and daily active users
- `BarChart` for game popularity
- `PieChart` for economy breakdown
- Data pulled from existing Supabase tables (`profiles`, `game_stats`, `activity_feed`, `bug_reports`)

**New component**: `src/components/AdminCMS.tsx` — Content management for announcements and featured games

**New component**: `src/components/AdminUserDetail.tsx` — Expanded user detail modal

**Modified file**: `src/pages/Admin.tsx` — Restructured with new tabs: Analytics, CMS, User Detail views, enhanced system health

**Database**: New migration for `announcements` table and `admin_audit_log` table

**No new dependencies needed** — recharts is already installed for charting.

### Payments (Batch 2)

- Enable Paddle via built-in integration
- Create a `battle_pass_purchases` table
- Edge function webhook handler for Paddle events
- Update `SeasonPass.tsx` with real purchase button

