# 💰 Paystub Tracker

A React application to help you track biweekly paystubs, manage payment delays, and monitor split payments.

## Features

- ✅ Track biweekly pay periods (Wednesday to Tuesday work weeks)
- 🔐 Email/password authentication with Supabase Auth
- 🛡️ User-isolated data model (each account only accesses its own records)
- 📅 Set expected payday (Tuesdays)
- 💵 Record expected payment amounts
- 📊 Add multiple actual payments (for split payments)
- ⚠️ Automatic delay detection
- 🎨 Visual status indicators (Complete, Partial, Delayed, Pending)
- ☁️ Data stored in Supabase

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file in the project root:

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For GitHub Pages deployment, set the same values in repository secrets:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Supabase Security Setup (Required)

Make sure your `pay_periods` table has a `user_id` column and Row Level Security policies.

Run this in Supabase SQL Editor (adjust only if your schema differs):

```sql
alter table public.pay_periods
	add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.pay_periods
set user_id = auth.uid()
where user_id is null;

alter table public.pay_periods
	alter column user_id set not null;

alter table public.pay_periods enable row level security;

drop policy if exists "Users can read own pay periods" on public.pay_periods;
create policy "Users can read own pay periods"
	on public.pay_periods
	for select
	using (auth.uid() = user_id);

drop policy if exists "Users can insert own pay periods" on public.pay_periods;
create policy "Users can insert own pay periods"
	on public.pay_periods
	for insert
	with check (auth.uid() = user_id);

drop policy if exists "Users can update own pay periods" on public.pay_periods;
create policy "Users can update own pay periods"
	on public.pay_periods
	for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "Users can delete own pay periods" on public.pay_periods;
create policy "Users can delete own pay periods"
	on public.pay_periods
	for delete
	using (auth.uid() = user_id);
```

In Supabase Auth settings:

- Disable signups if you want invite-only access
- Keep email confirmation enabled
- Set a strong password policy

## GitHub Pages Deployment

1. Push to `main`
2. In GitHub repository settings, open `Pages`
3. Set the source to `GitHub Actions`
4. Run the deploy workflow (or push again)

Your site URL:

`https://kevalmotivaras.github.io/pay-stub-tracker/`

## How to Use

1. **Add a Pay Period**: Enter your work week start date (Wednesday), expected payday (Tuesday), and expected amount
2. **Track Payments**: Click "Add Actual Payment" to record when you actually receive payments
3. **Monitor Status**: Cards automatically show status and calculate delays
4. **Split Payments**: Add multiple actual payments if your pay is split into different amounts

## Status Indicators

- ✓ **Complete**: Full expected amount received
- ⏳ **Partial**: Some payment received, but not the full amount
- ⚠️ **Delayed**: Expected payday passed, no payment received
- ⏰ **Pending**: Expected payday hasn't arrived yet

Enjoy tracking your paystubs securely.
