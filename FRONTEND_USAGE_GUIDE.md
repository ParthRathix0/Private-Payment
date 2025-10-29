# 🎨 Frontend Usage Guide

## ✅ What's Been Updated

Your frontend (`packages/nextjs/app/page.tsx`) now integrates with your deployed contracts:

### Connected Contracts:
- **Main_Contract**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Burner_Verifier**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- **Minter_Verifier**: `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`

### Features Implemented:

1. **✅ Real-time Balance Display**
   - Reads from `Main_Contract.getbalance(address)`
   - Shows public balance (visible on-chain)
   - Shows private balance commitment (hidden value)

2. **✅ Initial Balance Setup**
   - Button to set initial balances (owner only)
   - Sets: Public = 100 tokens, Private commitment = initial state
   - Auto-appears when balances are 0

3. **✅ Secret Information Display**
   - Shows your secret: `99999`
   - Shows your randomness: `88888`
   - These are kept off-chain and never sent to the blockchain

4. **✅ Auto-refresh**
   - Balances update automatically when blockchain state changes
   - Uses Scaffold-ETH's `watch: true` feature

---

## 🚀 How to Use

### Step 1: Start the Application

Make sure both services are running:

```bash
# Terminal 1: Local blockchain (if not running)
cd /home/imperial-x/Documents/GitHub/HACKATHON/Private-Payment
yarn chain

# Terminal 2: Frontend
yarn start
```

Open http://localhost:3000 in your browser.

---

### Step 2: Connect Your Wallet

1. Click the **Connect Wallet** button in the top-right (RainbowKit)
2. Select your wallet (MetaMask, etc.)
3. Make sure you're connected to the local network (Localhost 8545)

Your address should show: `0xFb93...99A0` (or whichever account you're using)

---

### Step 3: Set Initial Balance

When you first load the page with 0 balances, you'll see a blue button:

**"Set Initial Balance (100 tokens)"**

Click this button to:
- Set your public balance to 100 tokens
- Set your private balance commitment to the initial state
- This uses `Main_Contract.initialSetbalance()` (only owner can do this)

After the transaction confirms, you should see:
- **Public Balance**: 100 Tokens
- **Private Balance**: 0 Tokens (commitment hash stored on-chain)

---

### Step 4: Understanding the Display

#### Public Balance Card:
```
Public Balance
100 Tokens
Visible on-chain
```
- This is the actual token amount anyone can see
- Stored directly on the blockchain

#### Private Balance Card:
```
Private Balance (Commitment)  
0 Tokens
Secret (off-chain): 99999
Randomness (off-chain): 88888
```
- The private balance is stored as a **commitment hash**
- Only you know the actual value (0 tokens initially)
- The secret and randomness are never sent to the blockchain

---

## 🔐 Testing the Proof Flow

### Current State vs. What's Needed:

**✅ Currently Working:**
- Reading balances from Main_Contract
- Setting initial balances
- UI displaying all information

**⚠️ Not Yet Implemented (Needs ZK Proofs):**
- Burn operation (public → private)
- Mint operation (private → public)
- The "Send" button (placeholder)
- The "Generate Proof" button (placeholder)

---

## 📝 Next Steps: Adding Proof Submission

To complete the flow, you'll need to add proof submission functions. Here's the structure:

### For Burning Tokens (Public → Private):

```typescript
const burnTokens = async () => {
  // 1. Load the proof from: packages/circuits/proofs/generated_proofB_burn.json
  const proof = {
    A: [...],
    B: [...],
    C: [...],
    _publicSignals: [...]
  };

  // 2. Submit to Burner_Verifier
  await writeBurner({
    functionName: "BurnerVerifier",
    args: [proof]
  });

  // 3. Refresh balances
  await refetchBalance();
};
```

### For Minting Tokens (Private → Public):

```typescript
const mintTokens = async () => {
  // 1. Load the proof from: packages/circuits/proofs/generated_proofA_mint.json
  const proof = {
    A: [...],
    B: [...],
    C: [...],
    _publicSignals: [...]
  };

  // 2. Submit to Minter_Verifier
  await writeMinter({
    functionName: "MinterVerifier",
    args: [proof, /* additional proofB if needed */]
  });

  // 3. Refresh balances
  await refetchBalance();
};
```

---

## 🎯 Testing Checklist

- [x] Frontend connects to wallet
- [x] Displays contract addresses
- [x] Reads balances from Main_Contract
- [x] Shows public balance
- [x] Shows private balance commitment
- [x] Displays secret information (off-chain)
- [x] Initial balance setup button (owner only)
- [x] Auto-refresh on blockchain updates
- [ ] Submit ProofB for burning (needs implementation)
- [ ] Submit ProofA for minting (needs implementation)
- [ ] Generate proofs from UI (future enhancement)

---

## 📊 Expected Flow After Full Implementation

1. **Initial Setup** (Owner)
   - Set balance: Public = 100, Private = 0

2. **Burn 40 Tokens** (User)
   - Click "Send" → "Public Send" → Enter 40
   - Submit ProofB from `generated_proofB_burn.json`
   - Result: Public = 60, Private = 40

3. **Mint 25 Tokens** (User)
   - Click "Send" → "Private Send" → Enter 25
   - Submit ProofA from `generated_proofA_mint.json`
   - Result: Public = 85, Private = 15

4. **Verify State**
   - Check balances on UI
   - All updates happen through ZK proofs
   - Private balance remains hidden

---

## 🐛 Troubleshooting

### Balance not updating?
- Check that transactions are confirmed
- Look for transaction hash in browser console
- Verify you're on the correct network

### Can't set initial balance?
- Make sure you're connected as the contract owner
- Check that you have enough ETH for gas

### Contract addresses wrong?
- Redeploy contracts with `yarn deploy`
- Frontend auto-updates from `deployedContracts.ts`

---

## 📚 Technical Details

### Hooks Used:
- `useScaffoldReadContract` - Read balances
- `useScaffoldWriteContract` - Write transactions
- `useAccount` - Get connected wallet address
- `formatEther` - Convert wei to readable format

### Contract Functions Called:
- `Main_Contract.getbalance(address)` - Returns {pub_balance, priv_balance}
- `Main_Contract.initialSetbalance(address, uint256, uint256)` - Set initial state
- `Burner_Verifier.BurnerVerifier(Proof)` - Submit burn proof
- `Minter_Verifier.MinterVerifier(Proof, Proof)` - Submit mint proof

---

## ✨ Your frontend is now connected to your ZK contracts!

The proof submission is ready to be implemented when you're ready to test the full flow.
