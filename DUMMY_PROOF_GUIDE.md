# 🧪 DUMMY PROOF TESTING MODE - Quick Start Guide

## ✅ What Was Created

I've set up **DUMMY VERIFIERS** that accept any proof for testing purposes!

### New Files:
1. **`contracts/Verifier1_Dummy.sol`** - Dummy verifier for Circuit A (always returns true)
2. **`contracts/verifier_B1_Dummy.sol`** - Dummy verifier for Circuit B (always returns true)
3. **`deploy/01_deploy_test_mode.ts`** - Deployment script for test mode
4. **`scripts/testBurnWithDummyProof.ts`** - Complete test script for burning 100 tokens

### Original Files (PRESERVED):
- ✅ `contracts/Verifier1.sol` - Original real verifier (kept for production)
- ✅ `contracts/verifier_B1.sol` - Original real verifier (kept for production)
- ✅ `deploy/00_deploy_your_contract.ts` - Original deployment (kept for production)

**Nothing was deleted!** You can switch between test and production mode anytime.

---

## 🚀 Quick Start - Test Your Burn Operation

### Step 1: Start Hardhat Node (Terminal 1)

```bash
cd packages/hardhat
yarn chain
```

### Step 2: Deploy in TEST MODE (Terminal 2)

```bash
cd packages/hardhat
yarn deploy --tags TestMode --reset
```

You'll see:
```
⚠️  ================================ ⚠️
⚠️  TESTING MODE - DUMMY VERIFIERS  ⚠️
⚠️  ================================ ⚠️

📝 Deploying Groth16Verifier_Dummy (TEST ONLY)...
✅ Groth16Verifier_Dummy deployed at: 0x...
   ⚠️  This verifier accepts ANY proof!

📝 Deploying Groth16VerifierB_Dummy (TEST ONLY)...
✅ Groth16VerifierB_Dummy deployed at: 0x...
   ⚠️  This verifier accepts ANY proof!

...

⚠️  REMINDER: These dummy verifiers accept ANY proof!
⚠️  Use ONLY for testing.
```

### Step 3: Run the Test Script

```bash
npx hardhat run scripts/testBurnWithDummyProof.ts --network localhost
```

This will automatically:
1. ✅ Set your balance (4500 public, 5500 private)
2. ✅ Create a dummy proof
3. ✅ Submit burn transaction (burn 100 tokens)
4. ✅ Verify new balance (4500 public, 5600 private)

---

## 📋 What the Test Script Does

### Your Account: `0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0`

**Before:**
- Public Balance: 4500
- Private Balance: 5500

**Operation:** Burn 100 tokens (move to private)

**After:**
- Public Balance: 4500 (unchanged)
- Private Balance: 5600 (5500 + 100)

**Dummy Proof Used:**
```javascript
{
    A: [0, 0],           // Dummy - not checked
    B: [[0, 0], [0, 0]], // Dummy - not checked
    C: [0, 0],           // Dummy - not checked
    _publicSignals: [
        "4500",       // Current public balance
        "5500",       // Current private balance
        "5600",       // New private balance (+100)
        "123456789",  // Dummy amount_r hash
        "987654321"   // Dummy nullifier
    ]
}
```

**The dummy verifier accepts this proof regardless of the A, B, C values!**

---

## 🎮 Manual Testing (Hardhat Console)

If you prefer to test manually:

```bash
npx hardhat console --network localhost
```

In the console:

```javascript
// Get contracts
const main = await ethers.getContract("Main_Contract");
const burner = await ethers.getContract("Burner_Verifier");

// Set initial balance
await main.initialSetbalance(
    "0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0",
    4500,  // public
    5500   // private
);

// Check balance
let bal = await main.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("Before - Pub:", bal.pub_balance.toString(), "Priv:", bal.priv_balance.toString());

// Submit dummy proof
await burner.BurnerVerifier({
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: ["4500", "5500", "5600", "123456", "789012"]
});

// Check new balance
bal = await main.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("After - Pub:", bal.pub_balance.toString(), "Priv:", bal.priv_balance.toString());
```

Expected output:
```
Before - Pub: 4500 Priv: 5500
After - Pub: 4500 Priv: 5600
```

---

## 🔄 Switching Between Test and Production Mode

### Deploy in TEST MODE (with dummy verifiers):
```bash
yarn deploy --tags TestMode --reset
```

### Deploy in PRODUCTION MODE (with real verifiers):
```bash
yarn deploy --tags ZKPrivacy --reset
```

### Or deploy BOTH sets of contracts (for comparison):
```bash
yarn deploy --reset
```
This deploys both real and dummy verifiers, but only the FIRST deployment (real verifiers) will be wired to the main contracts.

---

## 🧪 Testing Different Scenarios

### Test 1: Burn 100 tokens (already provided)
```bash
npx hardhat run scripts/testBurnWithDummyProof.ts --network localhost
```

### Test 2: Burn Different Amount

Edit the script or do manually:
```javascript
await burner.BurnerVerifier({
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: [
        "4500",  // current public
        "5500",  // current private
        "5750",  // new private (+250)
        "111",   // dummy hash
        "222"    // unique nullifier
    ]
});
```

### Test 3: Test Replay Protection

Try using the same nullifier twice:
```javascript
// First burn - will succeed
await burner.BurnerVerifier({
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: ["4500", "5500", "5600", "123", "999"]
});

// Second burn with SAME nullifier - should fail
// (But only after you use it in a minter operation first)
```

### Test 4: Test Minter Flow

```javascript
const minter = await ethers.getContract("Minter_Verifier");

// Proof A (from burner chain)
const proofA = {
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: [
        "4500",  // current pub
        "5600",  // current priv
        "5500",  // new priv (-100)
        "555",   // amount_r hash (must match!)
        "999"    // nullifier from burn
    ]
};

// Proof B (from minter chain)
const proofB = {
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: [
        "5600",  // old commitment
        "5500",  // new commitment
        "555"    // amount_r hash (must match proofA!)
    ]
};

await minter.Minter_VerifierVerifier(proofA, proofB);

// Check balance
const bal = await main.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("After mint - Pub:", bal.pub_balance.toString(), "Priv:", bal.priv_balance.toString());
```

---

## 📊 Understanding Dummy vs Real Proofs

### Dummy Verifier (Testing):
```solidity
function verifyProof(...) public view returns (bool) {
    return true;  // Always accepts
}
```
- ✅ Good for testing contract logic
- ✅ No need for ZK circuits
- ✅ Fast development
- ❌ Zero security
- ❌ Anyone can create "valid" proofs

### Real Verifier (Production):
```solidity
function verifyProof(...) public view returns (bool) {
    // Complex cryptographic verification
    // Only accepts proofs from correct circuit
}
```
- ✅ Cryptographically secure
- ✅ Only valid ZK proofs accepted
- ✅ Production ready
- ⏰ Requires ZK circuit setup
- ⏰ Need snarkjs for proof generation

---

## 🎯 Your Current Status

### ✅ What You Can Do NOW:
- Test all contract interactions
- Test burn operations with any values
- Test minter operations
- Test nullifier tracking
- Test balance updates
- Debug contract logic
- Develop frontend integration

### ⏳ What You Need for Production:
- ZK circuit (circom) for burner
- ZK circuit (circom) for minter
- Compile circuits to get .wasm and .zkey
- Generate real verification keys
- Replace dummy verifiers with real ones

---

## 🔧 Configuration

All settings are in the deployment scripts:

**Test Mode**: `packages/hardhat/deploy/01_deploy_test_mode.ts`
```typescript
// Uses Groth16Verifier_Dummy
// Uses Groth16VerifierB_Dummy
```

**Production Mode**: `packages/hardhat/deploy/00_deploy_your_contract.ts`
```typescript
// Uses Groth16Verifier (real)
// Uses Groth16VerifierB (real)
```

---

## 🚨 Important Warnings

### ⚠️ DUMMY VERIFIERS ARE FOR TESTING ONLY!

**DO NOT use dummy verifiers on:**
- ❌ Testnets (Sepolia, Goerli, etc.)
- ❌ Mainnet
- ❌ Any public network
- ❌ Production environment

**Why?**
- Anyone can create "valid" proofs
- No cryptographic security
- Balances can be manipulated
- Funds can be stolen

**ONLY use on:**
- ✅ Local Hardhat network
- ✅ Your development machine
- ✅ Testing environment

---

## 📚 Next Steps

### 1. Test Your Contracts (NOW)
```bash
yarn deploy --tags TestMode --reset
npx hardhat run scripts/testBurnWithDummyProof.ts --network localhost
```

### 2. Develop Your Frontend
- Use dummy verifiers
- Build UI components
- Test user flows
- Debug integration

### 3. Create Your ZK Circuits
- Write circom code
- Define public/private inputs
- Test circuit logic
- Compile with circom

### 4. Generate Verification Keys
- Perform trusted setup
- Generate .zkey files
- Export verification keys
- Generate Verifier.sol

### 5. Switch to Production
- Replace Verifier1.sol with your generated verifier
- Replace verifier_B1.sol with your generated verifier
- Deploy with `yarn deploy --tags ZKPrivacy`
- Test with real proofs

---

## 🎊 Summary

**✅ You can now test your burn operation!**

**What changed:**
- Created dummy verifiers (Verifier1_Dummy, verifier_B1_Dummy)
- Created test deployment script (01_deploy_test_mode.ts)
- Created automated test script (testBurnWithDummyProof.ts)
- Kept all original files intact

**How to use:**
```bash
# Deploy test mode
yarn deploy --tags TestMode --reset

# Run test
npx hardhat run scripts/testBurnWithDummyProof.ts --network localhost
```

**Result:**
Your account balance will change from (4500, 5500) to (4500, 5600) ✅

**No real ZK proofs needed for testing!** 🎉
