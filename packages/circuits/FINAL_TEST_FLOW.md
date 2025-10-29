# 🎯 TWO-PROOF COHERENT TEST SCENARIO

**Test Account:** `0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0`

---

## 📌 STEP 0: INITIAL STATE (Set these on Scaffold UI)

After deploying contracts, set these initial values for your account:

```
Address: 0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0
Public Balance: 100
Private Balance Commitment: 6215144944274313431358390546859857435196839642684515675387282766541729288730
```

**🔐 Private data (NEVER put on-chain, keep for yourself):**
- Actual private balance: `0` tokens
- Secret: `99999`
- Randomness: `88888`

---

## 🔥 STEP 1: BURN 40 TOKENS (Circuit B - ProofB)

**What happens:** You "burn" 40 tokens from public balance, adding them to your private balance

**Circuit Used:** `proofB.circom` (Circuit B)
- Operation: `new_balance = private_balance + spend_amount` = 0 + 40 = **40**

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

### Generated Proof: `proofs/generated_proofB_burn.json` ✅ VERIFIED

### Public Signals: `proofs/generated_publicB_burn.json`
```json
[
  "4816159063570861999439650068245126571208251119684380018155356277867533694162",  // amount_hash = Poseidon(40, 88888)
  "6215144944274313431358390546859857435196839642684515675387282766541729288730",   // old_commitment (balance=0)
  "16435358715507912739881275654385770681213764389879180474675594982483059447741"  // new_commitment (balance=40)
]
```

### What to do in Scaffold:
1. Go to Burner_Verifier contract
2. Call `BurnerVerifier()` with the proof data from `generated_proofB_burn.json`
3. Pass the public signals from `generated_publicB_burn.json`

### Expected Result After Transaction:
- ✅ Public Balance: 100 → **60** tokens
- ✅ Private Balance (hidden): 0 → **40** tokens
- ✅ New Commitment: `16435358715507912739881275654385770681213764389879180474675594982483059447741`

---

## 💎 STEP 2: MINT 25 TOKENS (Circuit A - ProofA)

**What happens:** You "mint" 25 tokens from your private balance back to public

**Circuit Used:** `update_balance.circom` (Circuit A)
- Operation: `new_balance = private_balance - spend_amount` = 40 - 25 = **15**

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

### Generated Proof: `proofs/generated_proofA_mint.json` ✅ VERIFIED

### Public Signals: `proofs/generated_publicA_mint.json`
```json
[
  "4816159063570861999439650068245126571208251119684380018155356277867533694162",   // amount_hash = Poseidon(25, 88888)
  "9456442648981265869262459339048245167264739061504720774120760245771259232858",   // nullifier (prevents replay)
  "60",                                                                              // current public_balance
  "16435358715507912739881275654385770681213764389879180474675594982483059447741",  // old_commitment (balance=40)
  "20026553545680156500721779633019403414482557040109312483506003886488702860072"   // new_commitment (balance=15)
]
```

### What to do in Scaffold:
1. Go to Minter_Verifier contract
2. Call `MinterVerifier()` with the proof data from `generated_proofA_mint.json`
3. Pass the public signals from `generated_publicA_mint.json`

### Expected Result After Transaction:
- ✅ Public Balance: 60 → **85** tokens
- ✅ Private Balance (hidden): 40 → **15** tokens
- ✅ New Commitment: `20026553545680156500721779633019403414482557040109312483506003886488702860072`

---

## 📊 COMPLETE STATE TRANSITION TABLE

| Stage | Public Balance | Private Balance (Hidden) | Private Commitment Hash | Action |
|-------|----------------|--------------------------|-------------------------|--------|
| **Start** | 100 | 0 | `621514494427...` | Set initial state |
| **After Proof B** | 60 | 40 | `164353587155...` | Burned 40 tokens (pub→priv) |
| **After Proof A** | 85 | 15 | `200265535456...` | Minted 25 tokens (priv→pub) |

---

## ✅ PROOFS ARE COHERENT!

✅ **ProofB output commitment** (`16435358715507912739881275654385770681213764389879180474675594982483059447741`)  
   **= ProofA input commitment** (same hash)

✅ **ProofB ends with** private_balance = 40  
   **= ProofA starts with** private_balance = 40

✅ **Both use same secret** = 99999  
✅ **Both use same randomness** = 88888

---

## 📁 FILES TO USE IN SCAFFOLD

### For Burner_Verifier (First Transaction):
- **Proof:** `proofs/generated_proofB_burn.json`
- **Public Signals:** `proofs/generated_publicB_burn.json`

### For Minter_Verifier (Second Transaction):
- **Proof:** `proofs/generated_proofA_mint.json`
- **Public Signals:** `proofs/generated_publicA_mint.json`

---

## 🎓 UNDERSTANDING THE CIRCUITS

### Circuit A (`update_balance.circom`):
- **Sender/Spender circuit** - reduces private balance
- Formula: `new_balance = private_balance - spend_amount`
- Has `public_balance` input (checks you have enough total)
- Generates `nullifier` (prevents double-spending)
- **Used for MINTING** (private → public)

### Circuit B (`proofB.circom`):
- **Receiver circuit** - increases private balance  
- Formula: `new_balance = private_balance + spend_amount`
- No `public_balance` input needed
- No `nullifier` generated
- **Used for BURNING** (public → private)

---

## 🚀 YOU'RE READY!

1. ✅ Initial state defined
2. ✅ ProofB generated and verified (BURN 40 tokens)
3. ✅ ProofA generated and verified (MINT 25 tokens)
4. ✅ Proofs are coherent and linked
5. ✅ All files saved in `proofs/` directory

**Just deploy on Scaffold and test!** 🎉
