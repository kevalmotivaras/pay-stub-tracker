# 💰 Paystub Tracker

A React application to help you track biweekly paystubs, manage payment delays, and monitor split payments.

## Features

- ✅ Track biweekly pay periods (Wednesday to Tuesday work weeks)
- 📅 Set expected payday (Tuesdays)
- 💵 Record expected payment amounts
- 📊 Add multiple actual payments (for split payments)
- ⚠️ Automatic delay detection
- 🎨 Visual status indicators (Complete, Partial, Delayed, Pending)
- 💾 Data persists in browser localStorage

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

Enjoy tracking your paystubs! 🎉
