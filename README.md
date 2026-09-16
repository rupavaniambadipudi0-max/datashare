# DataShare 📱⚡

> **Virtual Mobile Data Sharing & Rewards Platform**  
> Share spare mobile data with peers, contribute to the community pool in emergencies, earn reward coins, and redeem telecom top-ups and lifestyle vouchers.

---

## 🌟 Key Features

1. **Peer-to-Peer Data Transfer**
   - Transfer cellular data (GBs) instantly to any 10-digit mobile number.
   - Built-in validation, balance guardrails, and duplicate transfer protection.
   - Real-time balance updates across both sender and recipient wallets.

2. **Community Emergency Data Pool**
   - Donate surplus data to a shared community reserve pool.
   - Users facing low or exhausted data balances can claim instant emergency packs.
   - Full community ledger and live audit history.

3. **Automated Coin Rewards Engine**
   - Earn reward coins automatically for every gigabyte shared or contributed (1 GB = 10 Reward Coins).
   - Authoritative ledger tracking total lifetime earned, spent, and current coin balance.

4. **Virtual Mobile Recharge Gateway**
   - Redeem reward coins for simulated telecom mobile recharges.
   - Supports major network operators: **Airtel, Jio, Vi (Vodafone Idea), and BSNL**.
   - Generates simulated carrier reference IDs, validity extensions, and instant confirmation SMS alerts.

5. **Rewards & Voucher Marketplace**
   - Redeem coins for lifestyle brand vouchers and discount codes (e.g., Swiggy, Zomato, BookMyShow, Disney+ Hotstar).
   - Generates unique coupon codes with single-click clipboard copying and redemption tracking.

6. **Real-Time Synchronization (SSE)**
   - Server-Sent Events (SSE) stream ledger transactions, notifications, and balance updates live without polling.

7. **Admin Operations & Telemetry Console**
   - Access key metrics: Total data shared, community pool balance, total users, and active fraud flags.
   - Inspect transaction logs and search user accounts with real-time status toggling (Active / Suspended).

---

## 🛠️ Technology Stack & Dependencies

### Frontend (Client)
| Dependency | Version | Purpose |
|------------|---------|---------|
| **React** | `^19.0.1` | Modern component UI framework |
| **React DOM** | `^19.0.1` | DOM renderer for React |
| **Vite** | `^6.2.3` | Next-generation frontend build tool and dev server |
| **Tailwind CSS** | `^4.1.14` | Utility-first CSS styling engine |
| **@tailwindcss/vite** | `^4.1.14` | Vite plugin for Tailwind CSS v4 |
| **Lucide React** | `^0.546.0` | Minimalist, clean UI icons |
| **Motion** | `^12.23.24` | Smooth declarative animations and transitions |

### Backend (Server)
| Dependency | Version | Purpose |
|------------|---------|---------|
| **Express** | `^4.21.2` | Fast, minimalist HTTP web server for Node.js |
| **sql.js** | `^1.14.2` | WebAssembly-powered embedded SQLite database engine (zero external setup) |
| **jsonwebtoken** | `^9.0.3` | Secure stateless JWT token generation and authorization |
| **dotenv** | `^17.2.3` | Environment variable loader |
| **@google/genai** | `^2.4.0` | Google Gen AI SDK for AI-assisted features |

### Developer Tools & Build
| Dependency | Version | Purpose |
|------------|---------|---------|
| **typescript** | `~5.8.2` | Static type safety and developer productivity |
| **tsx** | `^4.21.0` | High-speed TypeScript execution for development server |
| **esbuild** | `^0.25.0` | Ultra-fast Node server bundler for production builds |
| **@types/node** | `^22.14.0` | TypeScript definitions for Node.js runtime |
| **@types/express** | `^4.17.21` | TypeScript definitions for Express |
| **@types/jsonwebtoken** | `^9.0.10` | TypeScript definitions for JWT |
| **@types/sql.js** | `^1.4.11` | TypeScript definitions for sql.js |

---

## 🔑 Pre-Configured Demo Accounts

You can sign in using **any** 10-digit mobile number. For testing the simulated OTP gateway, any 6-digit number (such as `123456` or `000000`) is accepted.

Pre-seeded accounts ready to use out of the box:

| User | Mobile Number | Role | Initial Data Balance | Initial Coins |
|------|---------------|------|----------------------|---------------|
| **Arjun Sharma** | `9876543210` | User | 25.5 GB | 320 Coins |
| **Priya Patel** | `9876543211` | User | 12.0 GB | 180 Coins |
| **Vikram Rao** | `9999988888` | Super Admin | 100.0 GB | 1,500 Coins |

*(Switch between users in separate browser tabs or incognito windows to test live peer data transfers in real time!)*

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Node 20+ recommended)
- **npm** or **bun** / **yarn**

### 2. Clone and Install Dependencies
```bash
# Clone the repository (or extract downloaded ZIP)
git clone <your-repository-url>
cd datashare

# Install all project dependencies
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot on port `3000`. Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📦 Production Build & Deployment

### Build the Application
```bash
npm run build
```
This runs `vite build` for the React frontend and bundles `server.ts` into a self-contained production bundle at `dist/server.cjs`.

### Start Production Server
```bash
npm start
```

---

## 🌐 Free Cloud Hosting Options (No Billing Setup Needed)

If you downloaded the code or exported it to GitHub and want to host it for free:

### Option A: Render (Free Web Service)
1. Push your repository to **GitHub**.
2. Sign in to [Render.com](https://render.com) (free account, no credit card required).
3. Click **New +** → **Web Service** → Connect your GitHub repo.
4. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Deploy Web Service**.

### Option B: Railway or Koyeb
- Supports automatic detection of `package.json` build and start scripts.
- Simply connect your repository and deploy.

---

## 📁 Project Directory Structure

```
├── .env.example              # Environment variables template
├── metadata.json             # Applet manifest and capabilities
├── package.json              # Project scripts and dependencies
├── server.ts                 # Main Express server entry point & Vite middleware
├── server/
│   ├── config/               # Database and authentication configs
│   ├── controllers/          # Request handling logic
│   ├── middleware/           # JWT auth and request validation middleware
│   ├── routes/               # API route definitions (/auth, /transfer, /pool, /recharge, /admin)
│   └── services/             # Core business engines (dbService, ledger, notifications)
├── src/
│   ├── api/                  # Client-side API fetch client & SSE event listeners
│   ├── components/           # UI modules (Header, TransferModal, PoolCard, RechargeSection, etc.)
│   ├── types/                # Shared TypeScript models and interfaces
│   ├── App.tsx               # Main application layout and dashboard router
│   ├── main.tsx              # React DOM entry point
│   └── index.css             # Tailwind CSS global styles
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite bundler configuration
```

---

## 📄 License
This project is open-source and free for personal and educational use.
