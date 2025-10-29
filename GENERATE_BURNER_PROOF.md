# Generate Burner Proof - Step by Step Guide

## 📊 Your Burn Operation

**Account**: `0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0`

**Current State:**
- Public Balance: `4500`
- Private Balance: `5500`

**Operation**: Burn `100` tokens (Public → Private)

**After Burn:**
- New Public Balance: `4400` (4500 - 100)
- New Private Balance: `5600` (5500 + 100)

---

## 🔧 Prerequisites

You need these files (from your ZK circuit setup):

1. **Circuit File**: `burner.circom` or similar
2. **Compiled Circuit**: `burner.wasm` (WebAssembly)
3. **Proving Key**: `burner_final.zkey`
4. **Verification Key**: `verification_key.json` (used to generate Verifier1.sol)

If you don't have these, you need to:
1. Write your circom circuit
2. Compile it with circom
3. Generate proving/verification keys with snarkjs

---

## 📝 Step 1: Create Input File

Create a file `input.json` with your private inputs:

```json
{
  "currentPubBalance": "4500",
  "currentPrivBalance": "5500",
  "burnAmount": "100",
  "newPrivBalance": "5600",
  "salt": "123456789",
  "randomR": "987654321"
}
```

**Note**: 
- `salt` and `randomR` should be random values you choose
- `newPrivBalance` = `currentPrivBalance` + `burnAmount`
- These exact field names depend on your circuit design

---

## 🧮 Step 2: Generate Witness

Using snarkJS:

```bash
# Navigate to your circuit directory
cd path/to/your/circuit

# Generate witness
snarkjs wtns calculate burner.wasm input.json witness.wtns
```

This computes all internal signals in your circuit.

---

## 🔐 Step 3: Generate the Proof

```bash
# Generate proof using Groth16
snarkjs groth16 prove burner_final.zkey witness.wtns proof.json public.json
```

This creates:
- `proof.json` - The ZK proof (contains A, B, C points)
- `public.json` - The public signals (5 values)

---

## 📄 Step 4: Check the Output

**proof.json** should look like:
```json
{
  "pi_a": ["12345...", "67890...", "1"],
  "pi_b": [
    ["11111...", "22222..."],
    ["33333...", "44444..."],
    ["1", "0"]
  ],
  "pi_c": ["55555...", "66666...", "1"],
  "protocol": "groth16"
}
```

**public.json** should contain exactly 5 values:
```json
[
  "4500",      // currentPubBalance
  "5500",      // currentPrivBalance  
  "5600",      // newPrivBalance
  "7890123",   // amount_r hash (example)
  "4567890"    // nullifier (example)
]
```

**⚠️ Important**: The exact values in public.json depend on your circuit logic!

---

## 🎯 Step 5: Format for Smart Contract

Convert the proof to the format your contract expects:

**Using JavaScript:**

```javascript
import fs from 'fs';

// Read the files
const proof = JSON.parse(fs.readFileSync('proof.json', 'utf8'));
const publicSignals = JSON.parse(fs.readFileSync('public.json', 'utf8'));

// Format for contract
const proofForContract = {
    A: [proof.pi_a[0], proof.pi_a[1]],
    B: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],  // Note: reversed!
        [proof.pi_b[1][1], proof.pi_b[1][0]]   // Note: reversed!
    ],
    C: [proof.pi_c[0], proof.pi_c[1]],
    _publicSignals: publicSignals
};

console.log('Proof ready for contract:');
console.log(JSON.stringify(proofForContract, null, 2));
```

**⚠️ Note**: B coordinates are reversed for Solidity!

---

## 🚀 Step 6: Call the Contract

**Using ethers.js:**

```javascript
import { ethers } from 'ethers';

// Connect to contract
const burnerVerifier = await ethers.getContract("Burner_Verifier");

// Call BurnerVerifier
const tx = await burnerVerifier.BurnerVerifier({
    A: [proof.pi_a[0], proof.pi_a[1]],
    B: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    C: [proof.pi_c[0], proof.pi_c[1]],
    _publicSignals: [
        "4500",      // currentPubBalance
        "5500",      // currentPrivBalance
        "5600",      // newPrivBalance
        "7890123",   // amount_r_hash
        "4567890"    // nullifier
    ]
});

await tx.wait();
console.log("Burn successful!");

// Verify new balance
const mainContract = await ethers.getContract("Main_Contract");
const newBalance = await mainContract.getbalance("0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0");
console.log("New Public Balance:", newBalance.pub_balance.toString());
console.log("New Private Balance:", newBalance.priv_balance.toString());
```

**Using Hardhat Console:**

```javascript
const burnerVerifier = await ethers.getContract("Burner_Verifier");

await burnerVerifier.BurnerVerifier({
    A: ["0x1234...", "0x5678..."],
    B: [
        ["0xabcd...", "0xef01..."],
        ["0x2345...", "0x6789..."]
    ],
    C: ["0x9abc...", "0xdef0..."],
    _publicSignals: ["4500", "5500", "5600", "7890123", "4567890"]
});
```

---

## 🧪 Testing Without Real Proof (For Development)

If you're still developing and don't have the circuit yet, you can temporarily modify your verifier to return `true` for testing:

**⚠️ ONLY FOR LOCAL TESTING - NEVER ON MAINNET**

Modify `Verifier1.sol` temporarily:

```solidity
function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[5] memory input
) public view returns (bool r) {
    // TEMPORARY - for testing only
    return true;  // Always return true
}
```

Then you can call with dummy values:

```javascript
await burnerVerifier.BurnerVerifier({
    A: [0, 0],
    B: [[0, 0], [0, 0]],
    C: [0, 0],
    _publicSignals: ["4500", "5500", "5600", "1234", "5678"]
});
```

**Remember to revert this change before deploying to production!**

---

## 📚 Circuit Example (Circom)

Your burner circuit might look something like this:

```circom
pragma circom 2.0.0;

template Burner() {
    // Private inputs
    signal input currentPubBalance;
    signal input currentPrivBalance;
    signal input burnAmount;
    signal input salt;
    signal input randomR;
    
    // Public outputs
    signal output pubCurrentPubBalance;
    signal output pubCurrentPrivBalance;
    signal output pubNewPrivBalance;
    signal output pubAmountRHash;
    signal output pubNullifier;
    
    // Compute new private balance
    signal newPrivBalance;
    newPrivBalance <== currentPrivBalance + burnAmount;
    
    // Compute amount_r hash
    signal amountRHash;
    amountRHash <== hash(burnAmount, randomR);  // You need hash function
    
    // Compute nullifier
    signal nullifier;
    nullifier <== hash(currentPubBalance, currentPrivBalance, salt, burnAmount);
    
    // Output public signals
    pubCurrentPubBalance <== currentPubBalance;
    pubCurrentPrivBalance <== currentPrivBalance;
    pubNewPrivBalance <== newPrivBalance;
    pubAmountRHash <== amountRHash;
    pubNullifier <== nullifier;
}

component main = Burner();
```

---

## 🔍 Verification Checklist

Before calling the contract, verify:

- [ ] `_publicSignals[0]` = Your current public balance (4500)
- [ ] `_publicSignals[1]` = Your current private balance (5500)
- [ ] `_publicSignals[2]` = Your new private balance (5600)
- [ ] `_publicSignals[3]` = Hash of (amount + randomR)
- [ ] `_publicSignals[4]` = Unique nullifier
- [ ] New private balance = Old private balance + Burn amount
- [ ] The proof was generated with the correct circuit
- [ ] You're calling from the correct account address

---

## 🚨 Common Errors

### "Invalid proof"
- Your proof doesn't match the verification key in Groth16Verifier
- The circuit you used to generate the proof doesn't match the deployed verifier
- Public signals don't match what the circuit computed

### "Invalid current public balance"
- `_publicSignals[0]` doesn't match your actual on-chain balance
- Check with `mainContract.getbalance(yourAddress)`

### "Invalid current private balances"
- `_publicSignals[1]` doesn't match your actual on-chain private balance
- Check with `mainContract.getbalance(yourAddress)`

### "Not authorized"
- You're not calling from the correct address
- Make sure `msg.sender` is 0xFb93a8DcD5edc3FB6Cb34d77C6811835756c99A0

---

## 📖 Resources

- **snarkJS**: https://github.com/iden3/snarkjs
- **Circom**: https://docs.circom.io/
- **ZK Learning**: https://zkhack.dev/

---

## 🎓 Summary

To generate your burner proof:

1. **Create input.json** with your private values
2. **Generate witness**: `snarkjs wtns calculate`
3. **Generate proof**: `snarkjs groth16 prove`
4. **Format for contract**: Convert to Solidity format
5. **Call contract**: `burnerVerifier.BurnerVerifier(proof)`

The key challenge is having the correct ZK circuit and keys set up. Once you have those, proof generation is straightforward with snarkJS!
