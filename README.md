# Debtor Notebook - Angular + MongoDB + Telegram

Small debtor tracking system built with Angular, Netlify Functions and MongoDB Atlas.

## Features
- Add debtor name, amount, USD/KHR, owed date, deadline and note
- Dashboard totals separated by USD and Khmer Riel
- Search and filter Paid / Unpaid / Overdue
- Edit and delete debts
- Mark debt paid (Telegram reminders stop)
- Telegram reminders 3 days before, 1 day before, on due date, and daily while overdue
- Responsive phone/desktop design

## 1. Install
Use Node.js 20+.

```powershell
npm install
npm start
```

Important: `ng serve` displays the Angular UI, but the Netlify Functions API needs Netlify Dev for local full-stack testing.

Install Netlify CLI:
```powershell
npm install -g netlify-cli
netlify dev
```
Then open the URL Netlify Dev prints (normally http://localhost:8888).

## 2. MongoDB Atlas
Create a free MongoDB Atlas cluster and database user. Copy your connection string.

For local Netlify Dev, create `.env` in the project root (do NOT commit it):
```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=debtor_system
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 3. Telegram bot
1. In Telegram, open BotFather.
2. Send `/newbot`, choose a name and username, then copy the bot token.
3. Open your new bot and press Start / send it a message.
4. To obtain the chat ID, open in a browser:
   `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
5. Find `message.chat.id` and copy it into TELEGRAM_CHAT_ID.

Never put the Telegram token or MongoDB URI in Angular source code.

## 4. Deploy to Netlify
1. Push this project to GitHub, or import the folder into Netlify.
2. Netlify reads `netlify.toml` automatically.
3. In Netlify Site configuration > Environment variables, add:
   - MONGODB_URI
   - MONGODB_DB
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
4. Deploy.

The scheduled reminder function is configured for 01:00 UTC, which is 08:00 in Cambodia (UTC+7).

## Reminder behavior
- 3 days before deadline: one reminder
- 1 day before deadline: one reminder
- Due date: one reminder
- Overdue: one reminder each day until marked Paid

## Notes
This is intentionally a small single-user/student-friendly system. For a public production system, add authentication before storing private debtor information.

## Version 2: invoice attachments and Telegram summary
- Enter an invoice number and optionally attach a PDF, JPG, PNG or WebP (max 2 MB).
- Attachments are saved as base64 in MongoDB for this small student project; they are returned to the Angular UI. For many/large invoices use object storage instead.
- At 08:00 Cambodia time, the scheduled function sends grouped messages listing **all** unpaid debtors due today, overdue, due tomorrow, or due in 3 days, including names, amounts, invoice numbers, USD/KHR subtotals and number of people.
- Mark a debt Paid to stop further reminders.
- The schedule runs on deployed Netlify; `netlify dev` does not automatically run scheduled functions daily.
- **Security:** this starter project has no login. Before making your Netlify site public with real customer data or invoice files, add authentication and authorization to every API endpoint.
