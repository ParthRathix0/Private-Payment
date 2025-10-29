# 🎯 QUICK REFERENCE CARD

## Initial Setup
```
Address: 0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0
Public Balance: 100
Private Commitment: 6215144944274313431358390546859857435196839642684515675387282766541729288730
Secret (off-chain): 99999
Randomness (off-chain): 88888
```

## Transaction 1: BURN (ProofB - Circuit B)
**Action:** Deposit 40 tokens from public to private
**Contract:** Burner_Verifier
**Proof File:** `proofs/generated_proofB_burn.json`
**Public Signals:** `proofs/generated_publicB_burn.json`
**Result:** Public: 100→60, Private: 0→40

## Transaction 2: MINT (ProofA - Circuit A)
**Action:** Withdraw 25 tokens from private to public
**Contract:** Minter_Verifier  
**Proof File:** `proofs/generated_proofA_mint.json`
**Public Signals:** `proofs/generated_publicA_mint.json`
**Result:** Public: 60→85, Private: 40→15

## Key Files
- `FINAL_TEST_FLOW.md` - Complete detailed guide
- `DEPLOYMENT_PROOFS_SUMMARY.md` - Technical details
- `complete_setup_info.json` - All state data
- `input_proofB_burn.json` - Burn operation input
- `input_proofA_mint.json` - Mint operation input
- `generated_proofB_burn.json` - Burn proof (verified ✅)
- `generated_proofA_mint.json` - Mint proof (verified ✅)
