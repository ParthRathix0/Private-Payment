# 🔥 How to Burn 100 Tokens - Complete Guide

## Your Scenario

**Account**: `0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0`
**Current Balances**:
- Public: 4500
- Private: 5500

**Goal**: Burn 100 tokens (move from public to private)

**After Operation**:
- Public: 4400 (4500 - 100)
- Private: 5600 (5500 + 100)

---

## ⚡ Quick Answer

**I cannot generate the actual ZK proof for you** because:
1. You need the actual ZK circuit (circom files)
2. You need the proving key from circuit compilation
3. ZK proofs require snarkjs or similar tools

**But I CAN show you:**
- ✅ Exactly what inputs you need
- ✅ How to generate the proof with snarkjs
- ✅ How to submit it to your contract
- ✅ A ready-to-use script to help you

---

## 🎯 Two Options

### Option 1: Generate Real Proof (Production Ready)

**You need:**
1. Your ZK circuit (circom code)
2. Compiled circuit files (`.wasm`, `.zkey`)
3. snarkjs installed

**Follow the guide**: `GENERATE_BURNER_PROOF.md`

**Steps**:
```bash
# 1. Create input file with your values
# 2. Generate witness
snarkjs wtns calculate burner.wasm input.json witness.wtns

# 3. Generate proof
snarkjs groth16 prove burner_final.zkey witness.wtns proof.json public.json

# 4. Submit proof
npx hardhat run scripts/submitBurnerProof.ts --network localhost
```

---

### Option 2: Test Without Proof (Development Only)

For testing your contract logic without having the full ZK circuit:

**⚠️ WARNING: ONLY for local testing! Never use on production!**

#### Step 1: Temporarily Modify Verifier

Edit `packages/hardhat/contracts/Verifier1.sol`:

```solidity
function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[5] memory input
) public view returns (bool r) {
    // TEMPORARY - TESTING ONLY
    return true;  // Always accept proof
}
```

#### Step 2: Redeploy

```bash
cd packages/hardhat
yarn deploy --reset
```

#### Step 3: Set Your Initial Balance

```bash
npx hardhat console --network localhost
```

In console:
```javascript
const mainContract = await ethers.getContract("Main_Contract");
const [deployer] = await ethers.getSigners();

// Set your balance
await mainContract.initialSetbalance(
    "0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0",
    4500,  // public
    5500   // private
);

// Verify
const balance = await mainContract.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("Public:", balance.pub_balance.toString());
console.log("Private:", balance.priv_balance.toString());
```

#### Step 4: Call Burner with Dummy Proof

```javascript
const burnerVerifier = await ethers.getContract("Burner_Verifier");

// Switch to your account (if different from deployer)
// const yourSigner = await ethers.getSigner("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
// const burnerWithYou = burnerVerifier.connect(yourSigner);

await burnerVerifier.BurnerVerifier({
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: [
        "4500",     // current public balance
        "5500",     // current private balance
        "5600",     // new private balance (5500 + 100)
        "123456",   // dummy amount_r hash
        "789012"    // dummy nullifier (make unique each time)
    ]
});

// Check new balance
const newBalance = await mainContract.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("New Public:", newBalance.pub_balance.toString());   // Should be 4500
console.log("New Private:", newBalance.priv_balance.toString()); // Should be 5600
```

**Note**: The burner doesn't change public balance, it only updates private balance!

---

## 📊 What the Burner Proof Must Prove

Your ZK circuit needs to prove (without revealing):

1. **You know the current balances**
   - Current public: 4500
   - Current private: 5500

2. **The burn amount** (100 tokens)

3. **New private balance is correct**
   - New private = Old private + Burn amount
   - 5600 = 5500 + 100

4. **Unique nullifier** (prevents replay attacks)

5. **Amount_r hash** (needed for minting later)

---

## 🔍 Understanding the Public Signals

Your proof must output exactly 5 public signals:

```javascript
[
  4500,      // [0] Current public balance
  5500,      // [1] Current private balance (commitment)
  5600,      // [2] New private balance (commitment)
  hash(...), // [3] Hash of (amount + random) for minting
  unique_id  // [4] Nullifier (prevents double-burn)
]
```

**The contract will check:**
- ✅ Proof is valid (using Groth16Verifier)
- ✅ `publicSignals[0]` == your on-chain public balance
- ✅ `publicSignals[1]` == your on-chain private balance

---

## 📝 Example Circuit Input

If you have your circuit, create `input.json`:

```json
{
  "currentPubBalance": "4500",
  "currentPrivBalance": "5500",
  "burnAmount": "100",
  "salt": "YOUR_SECRET_SALT",
  "randomR": "YOUR_RANDOM_VALUE"
}
```

**Important**: 
- Salt and randomR should be secure random numbers
- Keep them secret!
- The circuit computes newPrivBalance and other public signals

---

## 🛠️ Helper Script

I created a script to help you: `packages/hardhat/scripts/submitBurnerProof.ts`

**Usage**:
```bash
# 1. Generate proof with snarkjs (creates proof.json and public.json)
snarkjs groth16 prove ...

# 2. Run the script
npx hardhat run scripts/submitBurnerProof.ts --network localhost
```

The script will:
- ✅ Check your current balance
- ✅ Load and format your proof
- ✅ Submit to Burner_Verifier
- ✅ Verify the balance changed correctly

---

## 🚨 Important Notes

1. **Burner doesn't change public balance!**
   - It only updates the private balance
   - Public balance stays 4500

2. **You must call from your account**
   - The contract checks `msg.sender`
   - Must be: 0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0

3. **Public signals must match on-chain state**
   - `publicSignals[0]` must equal your current public balance
   - `publicSignals[1]` must equal your current private balance
   - Otherwise: "Invalid current public balance" error

4. **Nullifier must be unique**
   - Each burn needs a different nullifier
   - Prevents replay attacks

---

## 📚 Files Created for You

1. **GENERATE_BURNER_PROOF.md** - Complete guide to generating proofs
2. **scripts/submitBurnerProof.ts** - Helper script to submit proofs
3. **This file** - Quick reference for your specific case

---

## 🎓 Next Steps

### If you have your ZK circuit ready:
1. Follow `GENERATE_BURNER_PROOF.md`
2. Generate proof with snarkjs
3. Run `submitBurnerProof.ts`

### If you're still building the circuit:
1. Use Option 2 above (dummy proof for testing)
2. Test your contract logic
3. Build your circuit
4. Replace with real proofs later

### If you need help with circuits:
- Check out circom documentation: https://docs.circom.io/
- See snarkjs guide: https://github.com/iden3/snarkjs
- Look at example circuits in the circom repo

---

## 💡 Quick Test Command

To quickly test the flow (with dummy verifier):

```bash
# Terminal 1
cd packages/hardhat
yarn chain

# Terminal 2
cd packages/hardhat

# Modify Verifier1.sol to return true (see Option 2)
yarn deploy --reset

# Console
npx hardhat console --network localhost

# In console - paste all:
const main = await ethers.getContract("Main_Contract");
const burner = await ethers.getContract("Burner_Verifier");
await main.initialSetbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0", 4500, 5500);
await burner.BurnerVerifier({A:[0,0],B:[[0,0],[0,0]],C:[0,0],_publicSignals:["4500","5500","5600","123","789"]});
const bal = await main.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("Pub:", bal.pub_balance.toString(), "Priv:", bal.priv_balance.toString());
```

Expected output: `Pub: 4500 Priv: 5600` ✅

---

## 🎉 Summary

**To generate a real burner proof**, you need:
- ✅ ZK circuit (circom)
- ✅ Proving key (.zkey file)
- ✅ snarkjs tool

**I've provided**:
- ✅ Complete guide (GENERATE_BURNER_PROOF.md)
- ✅ Helper script (submitBurnerProof.ts)
- ✅ Testing method (Option 2)
- ✅ Fixed your contract (added onlyOwner to transferOwnership)

**The actual proof generation** must be done with snarkjs on your machine using your circuit and keys!
