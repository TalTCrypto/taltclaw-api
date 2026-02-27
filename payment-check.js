/**
 * Simple SOL payment verification
 * Check if a wallet has sent SOL to TalTClaw wallet recently
 * No facilitator needed — just check the blockchain
 */

const TALTCLAW_WALLET = '3Ni5XqaKYQnhvwTgbyT4Dk68JDnuZKJNMVLpngvTxwHe';
const MIN_PAYMENT_SOL = 0.01; // ~$0.80 per query
const PAYMENT_WINDOW_HOURS = 24; // payment valid for 24h

async function checkPayment(payerWallet, heliusApiKey) {
  const HELIUS_API = `https://api-mainnet.helius-rpc.com/v0`;
  
  try {
    // Get recent transactions to our wallet
    const resp = await fetch(
      `${HELIUS_API}/addresses/${TALTCLAW_WALLET}/transactions/?api-key=${heliusApiKey}&limit=50`
    );
    if (!resp.ok) return { paid: false, error: 'API error' };
    
    const txs = await resp.json();
    const cutoff = Date.now() / 1000 - (PAYMENT_WINDOW_HOURS * 3600);
    
    for (const tx of txs) {
      if (tx.timestamp < cutoff) break; // too old
      if (tx.transactionError) continue;
      
      // Check for SOL transfer from payer to us
      for (const transfer of (tx.nativeTransfers || [])) {
        if (
          transfer.fromUserAccount === payerWallet &&
          transfer.toUserAccount === TALTCLAW_WALLET &&
          transfer.amount >= MIN_PAYMENT_SOL * 1e9 // lamports
        ) {
          return {
            paid: true,
            amount: transfer.amount / 1e9,
            tx: tx.signature,
            timestamp: tx.timestamp
          };
        }
      }
    }
    
    return { paid: false };
  } catch (e) {
    return { paid: false, error: e.message };
  }
}

module.exports = { checkPayment, MIN_PAYMENT_SOL, PAYMENT_WINDOW_HOURS };
