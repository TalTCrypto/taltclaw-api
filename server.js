/**
 * TalTClaw Wallet Analysis API — x402 Powered
 * 
 * Autonomous AI agent selling onchain intelligence.
 * Pay per query in USDC on Solana. No signup, no API keys.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4020;

const TALTCLAW_WALLET = '3Ni5XqaKYQnhvwTgbyT4Dk68JDnuZKJNMVLpngvTxwHe';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_API = `https://api-mainnet.helius-rpc.com/v0`;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

let stats = { totalQueries: 0, startTime: Date.now() };

// ============ FREE ENDPOINTS ============

app.get('/', (req, res) => {
  res.json({
    name: 'TalTClaw Wallet Analysis API',
    agent: 'TalTClaw — Autonomous AI Agent on Solana',
    wallet: TALTCLAW_WALLET,
    twitter: '@TalTCrypto',
    version: '0.1.0',
    endpoints: {
      'GET /': 'This page (free)',
      'GET /health': 'Health check (free)',
      'GET /analyze/:wallet': 'Full behavioral analysis of any Solana wallet',
      'GET /stats': 'Service statistics (free)'
    },
    pricing: {
      analyze: 'Free during beta. x402 USDC payments coming soon.',
      note: 'Built by an AI agent. Powered by Helius.'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'alive', uptime: Math.floor((Date.now() - stats.startTime) / 1000) });
});

// The Deal — riskoriented challenge
const fs = require('fs');
const dealHTML = fs.readFileSync(path.join(__dirname, 'deal.html'), 'utf8');
app.get('/deal', (req, res) => {
  res.type('html').send(dealHTML);
});

app.get('/stats', (req, res) => {
  res.json({
    totalQueries: stats.totalQueries,
    uptime: Math.floor((Date.now() - stats.startTime) / 1000),
    version: '0.1.0'
  });
});

// ============ ANALYSIS ENDPOINT ============

app.get('/analyze/:wallet', async (req, res) => {
  const { wallet } = req.params;
  stats.totalQueries++;

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  try {
    const analysis = await analyzeWallet(wallet);
    res.json({
      agent: 'TalTClaw',
      wallet,
      timestamp: new Date().toISOString(),
      analysis,
      _meta: { powered_by: 'Helius Enhanced API', agent_wallet: TALTCLAW_WALLET }
    });
  } catch (err) {
    console.error(`Error analyzing ${wallet}:`, err.message);
    res.status(500).json({ error: 'Analysis failed', detail: err.message });
  }
});

// ============ ANALYSIS ENGINE ============

async function analyzeWallet(wallet) {
  let txs;
  try {
    const resp = await fetch(`${HELIUS_API}/addresses/${wallet}/transactions/?api-key=${HELIUS_API_KEY}&limit=100`);
    if (!resp.ok) throw new Error(`Helius ${resp.status}`);
    txs = await resp.json();
  } catch (e) {
    // Fallback RPC
    const resp = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [wallet, { limit: 100 }] })
    });
    const data = await resp.json();
    return { note: 'Limited analysis (Enhanced API unavailable)', total_txs: data.result?.length || 0 };
  }

  const n = txs.length;
  if (n === 0) return { classification: 'empty_wallet', total_txs: 0 };

  let swaps = 0, transfers = 0, failed = 0, successful = 0;
  let volumeUsd = 0, nightCount = 0, weekendCount = 0;
  const programs = new Set();
  const sources = {};
  const timestamps = [];
  const dayCounts = {};

  for (const tx of txs) {
    const ts = tx.timestamp;
    if (ts) {
      timestamps.push(ts);
      const dt = new Date(ts * 1000);
      const day = dt.toISOString().split('T')[0];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      if (dt.getUTCHours() < 6) nightCount++;
      if (dt.getUTCDay() % 6 === 0) weekendCount++;
    }

    if (tx.transactionError) failed++;
    else successful++;

    const type = tx.type || 'UNKNOWN';
    if (type === 'SWAP') swaps++;
    else if (type === 'TRANSFER') transfers++;

    const src = tx.source || 'UNKNOWN';
    sources[src] = (sources[src] || 0) + 1;

    for (const inst of (tx.instructions || [])) {
      if (inst.programId) programs.add(inst.programId);
    }

    for (const t of (tx.tokenTransfers || [])) {
      if (t.fromUserAccount === wallet) {
        const mint = t.mint || '';
        const amt = t.tokenAmount || 0;
        if (['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'].includes(mint)) {
          volumeUsd += amt;
        } else if (mint === 'So11111111111111111111111111111111111111112') {
          volumeUsd += amt * 150;
        }
      }
    }
  }

  timestamps.sort();
  const activeDays = Object.keys(dayCounts).length;
  const dayValues = Object.values(dayCounts);
  const maxInDay = dayValues.length ? Math.max(...dayValues) : 0;
  const avgPerDay = activeDays ? n / activeDays : 0;

  let stddev = 0;
  if (timestamps.length > 1) {
    const intervals = [];
    for (let i = 0; i < timestamps.length - 1; i++) intervals.push(timestamps[i + 1] - timestamps[i]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    stddev = Math.sqrt(intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length);
  }

  // Classification
  const swapRatio = swaps / Math.max(1, n);
  const nightRatio = nightCount / Math.max(1, n);
  let classification;
  if (swapRatio > 0.7 && stddev < 60) classification = 'bot_trader';
  else if (swapRatio > 0.5) classification = 'active_trader';
  else if (transfers / Math.max(1, n) > 0.7) classification = 'transfer_heavy';
  else if (nightRatio > 0.5) classification = 'night_operator';
  else if (activeDays > 30) classification = 'long_term_user';
  else classification = 'casual_user';

  return {
    classification,
    summary: {
      total_txs: n, success_rate: +(successful / n).toFixed(4),
      active_days: activeDays, estimated_volume_usd: +volumeUsd.toFixed(2)
    },
    breakdown: { swaps, transfers, other: n - swaps - transfers - failed, failed },
    temporal: {
      first_tx: new Date(timestamps[0] * 1000).toISOString(),
      last_tx: new Date(timestamps[timestamps.length - 1] * 1000).toISOString(),
      avg_txs_per_day: +avgPerDay.toFixed(2), max_txs_in_day: maxInDay,
      burst_score: +(maxInDay / Math.max(1, avgPerDay)).toFixed(2),
      night_ratio: +(nightRatio).toFixed(4),
      weekend_ratio: +(weekendCount / Math.max(1, n)).toFixed(4),
      tx_frequency_stddev_seconds: +stddev.toFixed(2)
    },
    programs: { unique_count: programs.size, top_sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 5) }
  };
}

app.listen(PORT, () => {
  console.log(`🔥 TalTClaw API live on port ${PORT}`);
  console.log(`   Wallet: ${TALTCLAW_WALLET}`);
  console.log(`   Helius: ${HELIUS_API_KEY ? '✅' : '❌'}`);
});
