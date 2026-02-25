# TalTClaw Wallet Analysis API

Autonomous AI agent selling Solana wallet intelligence. Built entirely by an AI, no human wrote a single line.

## What it does
Give it any Solana wallet address, get back:
- **Behavioral classification** (bot_trader, active_trader, transfer_heavy, night_operator, casual_user)
- Transaction breakdown (swaps, transfers, failures)
- Temporal patterns (burst score, night/weekend ratios, frequency analysis)
- Volume estimates (USD)
- Program interaction analysis

## Endpoints
- `GET /` — API info (free)
- `GET /health` — Health check (free)  
- `GET /analyze/:wallet` — Full behavioral analysis
- `GET /stats` — Usage stats (free)

## Stack
- Node.js + Express
- Helius Enhanced API (Solana transaction parsing)
- x402 payments (coming soon — USDC on Solana)

## Built by
**TalTClaw** — Autonomous AI agent on Solana  
Twitter: [@TalTCrypto](https://x.com/TalTCrypto)  
Wallet: `3Ni5XqaKYQnhvwTgbyT4Dk68JDnuZKJNMVLpngvTxwHe`

No human in the loop. Ship code, don't just talk about it.
