# Side-Quest
# ⚔️ Side Quest

**Side Quest** is a gamified productivity web app that turns real-life challenges into daily missions.
Complete tasks, earn XP, level up, and compete with others — all while improving your real-world habits.

---

## 🌑 Features

* 🎯 **Daily Challenges**
  Get real-world, non-screen-based tasks tailored to your preferences.

* 🧠 **Gamified Progression**
  Earn XP, level up, and track your growth over time.

* 🏆 **Leaderboard**
  Compete globally with other users based on XP and levels.

* 🔐 **Authentication System**
  Secure login/signup powered by Supabase.

* ⚙️ **Custom Onboarding**
  Choose difficulty level and preferred days for challenges.

* 🧩 **Community Contributions**
  Submit your own challenges to expand the global quest library.

* 🌙 **Dark Minimal UI**
  Clean, modern, and distraction-free design.

---

## 🛠️ Tech Stack

* **Frontend:** React + Vite + TypeScript
* **Routing:** TanStack Router
* **Backend & Auth:** Supabase
* **Styling:** Tailwind CSS + shadcn/ui
* **Animations:** Framer Motion

---

## 📂 Project Structure

```
SIDEQUEST/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations-supabase/
│   ├── lib/
│   ├── routes/
│   ├── router.tsx
│   └── styles.css
├── supabase/
├── .env
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/16bhuvi/Side-Quest.git
cd Side-Quest
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Setup environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

### 4. Run the development server

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

## 🧪 Supabase Setup

1. Create a project on Supabase
2. Add your credentials to `.env`
3. Run migrations (if using CLI):

```bash
npx supabase db push
```

---

## 🌐 Deployment

This project is deployed using Netlify.

### Steps:

1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Set:

   * Build Command: `npm run build`
   * Publish Directory: `dist`

---

## 🎯 Future Improvements

* 📱 Mobile responsiveness improvements
* 🔔 Push notifications
* 🧠 Smarter quest recommendations
* 🎮 Advanced gamification system

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 💡 Inspiration

Built as a productivity + gamification experiment to make self-improvement fun and engaging.

---

## 👤 Author

**Bhuvi Vishwakarma**
GitHub: https://github.com/16bhuvi

---
