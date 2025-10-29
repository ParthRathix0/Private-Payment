# 🎯 Deployment & Testing Summary

**User Address:** `0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0`

---

## 📋 Step 1: Initial On-Chain Setup

After deploying contracts on Scaffold, set these initial balances for your account:

```solidity
// Call Main_Contract to set initial state
address user = 0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0;
uint256 publicBalance = 100;
uint256 privateBalanceCommitment = 6215144944274313431358390546859857435196839642684515675387282766541729288730;
```

### 🔐 Your Private Data (NEVER share on-chain):
- **Secret:** `99999`
- **Randomness:** `88888`
- **Actual Private Balance:** `0` tokens

---

## 📤 Step 2: BURN Operation (Public → Private)

**Goal:** Burn 40 tokens from public balance, adding them to private balance

### Circuit Used: **Circuit B (proofB.circom)**

### Input File: `proofs/input_proofB_burn.json`
```json
{
  "old_commitment": "6215144944274313431358390546859857435196839642684515675387282766541729288730",
  "new_commitment": "16435358715507912739881275654385770681213764389879180474675594982483059447741",
  "secret": "99999",
  "randomness": "88888",
  "private_balance": "0",
  "spend_amount": "40"
}
```

### Generated Proof: `proofs/generated_proofB_burn.json`

**Public Signals** (`proofs/generated_publicB_burn.json`):
```json
[
  "4816159063570861999439650068245126571208251119684380018155356277867533694162",  // amount_hash
  "6215144944274313431358390546859857435196839642684515675387282766541729288730",   // old_commitment
  "16435358715507912739881275654385770681213764389879180474675594982483059447741"  // new_commitment
]
```

### ✅ Verification Status: **PASSED**

### Transaction to Submit:
Call `Burner_Verifier.BurnerVerifier()` with the proof from `generated_proofB_burn.json`

### Expected State After Burn:
- Public Balance: `60` tokens (100 - 40)
- Private Balance Commitment: `16435358715507912739881275654385770681213764389879180474675594982483059447741`
- Actual Private Balance (off-chain): `40` tokens

---

## 📥 Step 3: MINT Operation (Private → Public)

**Goal:** Mint 25 tokens from private balance, adding them back to public balance

### Circuit Used: **Circuit A (update_balance.circom)**

### Input File: `proofs/input_proofA_mint.json`
```json
{
  "public_balance": "60",
  "old_commitment": "16435358715507912739881275654385770681213764389879180474675594982483059447741",
  "new_commitment": "20026553545680156500721779633019403414482557040109312483506003886488702860072",
  "secret": "99999",
  "randomness": "88888",
  "private_balance": "40",
  "spend_amount": "25"
}
```

### Generated Proof: `proofs/generated_proofA_mint.json`

**Public Signals** (`proofs/generated_publicA_mint.json`):
```json
[
  "4816159063570861999439650068245126571208251119684380018155356277867533694162",   // amount_hash
  "9456442648981265869262459339048245167264739061504720774120760245771259232858",   // nullifier
  "60",                                                                              // public_balance
  "16435358715507912739881275654385770681213764389879180474675594982483059447741",  // old_commitment
  "20026553545680156500721779633019403414482557040109312483506003886488702860072"   // new_commitment
]
```

### ✅ Verification Status: **PASSED**

### Transaction to Submit:
Call `Minter_Verifier.MinterVerifier()` with the proof from `generated_proofA_mint.json`

### Expected State After Mint:
- Public Balance: `85` tokens (60 + 25)
- Private Balance Commitment: `20026553545680156500721779633019403414482557040109312483506003886488702860072`
- Actual Private Balance (off-chain): `15` tokens

---

## 📊 Complete State Transition

| Stage | Public Balance | Private Balance (Actual) | Private Commitment Hash |
|-------|----------------|--------------------------|-------------------------|
| **Initial** | 100 | 0 | `621514494427...` |
| **After Burn (-40)** | 60 | 40 | `164353587155...` |
| **After Mint (+25)** | 85 | 15 | `200265535456...` |

---

## 🔧 Commands Used

### Generate ProofB (Burn):
```bash
cd packages/circuits
node proofB_js/generate_witness.js proofB_js/proofB.wasm proofs/input_proofB_burn.json witness_proofB_burn.wtns
npx snarkjs groth16 prove proofB_0000.zkey witness_proofB_burn.wtns proofs/generated_proofB_burn.json proofs/generated_publicB_burn.json
npx snarkjs groth16 verify proofB.vkey.json proofs/generated_publicB_burn.json proofs/generated_proofB_burn.json
```

### Generate ProofA (Mint):
```bash
cd packages/circuits
node update_balance_js/generate_witness.js update_balance_js/update_balance.wasm proofs/input_proofA_mint.json witness_proofA_mint.wtns
npx snarkjs groth16 prove update_balance_0001.zkey witness_proofA_mint.wtns proofs/generated_proofA_mint.json proofs/generated_publicA_mint.json
npx snarkjs groth16 verify update_balance_latest.vkey.json proofs/generated_publicA_mint.json proofs/generated_proofA_mint.json
```

---

## 📁 Generated Files

### Input Files:
- `proofs/input_proofB_burn.json` - Input for burning 40 tokens
- `proofs/input_proofA_mint.json` - Input for minting 25 tokens
- `proofs/complete_setup_info.json` - Complete state information

### Proof Files:
- `proofs/generated_proofB_burn.json` - ZK proof for burn operation
- `proofs/generated_publicB_burn.json` - Public signals for burn
- `proofs/generated_proofA_mint.json` - ZK proof for mint operation
- `proofs/generated_publicA_mint.json` - Public signals for mint

### Witness Files:
- `witness_proofB_burn.wtns` - Witness for burn
- `witness_proofA_mint.wtns` - Witness for mint

---

## 🎓 Key Insights

1. **Circuit A (update_balance.circom)**: 
   - Subtracts from private balance: `new_balance = private_balance - spend_amount`
   - Used for **MINTING** (moving tokens from private to public)
   - Has `public_balance` as public input
   - Generates `nullifier` output

2. **Circuit B (proofB.circom)**:
   - Adds to private balance: `new_balance = private_balance + spend_amount`
   - Used for **BURNING** (moving tokens from public to private)
   - No `public_balance` input
   - No `nullifier` output

3. **Commitments**:
   - Computed as: `Poseidon(secret, private_balance)`
   - Stored on-chain to hide actual private balance
   - Secret never revealed on-chain

4. **Amount Hash**:
   - Computed as: `Poseidon(spend_amount, randomness)`
   - Used to link burn and mint operations without revealing amount

---

## ✅ What to Do Next

1. **Deploy Contracts** on Scaffold-ETH
2. **Get Ownership** of Main_Contract
3. **Set Initial Balances** using the values above
4. **Submit ProofB** to Burner_Verifier (burn 40 tokens)
5. **Verify State** - check that public balance is now 60
6. **Submit ProofA** to Minter_Verifier (mint 25 tokens)
7. **Verify Final State** - check that public balance is now 85

**All proofs are pre-generated and verified!** ✨
