# Owner Functions Guide - Main_Contract

## 🔑 How Ownership Works

### Automatic Owner Setup
When you deploy `Main_Contract`, **you automatically become the owner**:

```solidity
constructor() {
    owner = msg.sender;  // ← Deployer becomes owner
}
```

**No additional setup needed!** You're the owner from the moment of deployment.

---

## 📋 Owner-Only Functions

As the owner, you have exclusive access to these functions:

### 1. `initialSetbalance` - Set User Balances

**Purpose**: Set initial balances for users (useful for testing or initial distribution)

**Usage**:
```javascript
// Via ethers.js
await mainContract.initialSetbalance(
    "0x1234...5678",  // user address
    1000,             // public balance
    500               // private balance
);
```

**Via Frontend (Debug Tab)**:
```
Function: initialSetbalance
- user: 0x1234567890abcdef1234567890abcdef12345678
- pub_balance: 1000
- priv_balance: 500
```

### 2. `setBurnController` - Set Burn Controller

**Purpose**: Authorize the Burner_Verifier contract to manage burns

**Usage**:
```javascript
await mainContract.setBurnController("0xBurnerVerifierAddress");
```

**Note**: This is done automatically during deployment!

### 3. `setMintController` - Set Mint Controller

**Purpose**: Authorize the Minter_Verifier contract to manage mints

**Usage**:
```javascript
await mainContract.setMintController("0xMinterVerifierAddress");
```

**Note**: This is done automatically during deployment!

### 4. `transferOwnership` - Transfer Ownership (NEW)

**Purpose**: Transfer ownership to a new address

**Usage**:
```javascript
await mainContract.transferOwnership("0xNewOwnerAddress");
```

**⚠️ Warning**: After transfer, you will NO LONGER be the owner!

---

## 🎯 Common Use Cases

### Use Case 1: Set Initial Balances for Testing

```javascript
// Set balance for your test account
await mainContract.initialSetbalance(
    await signer.getAddress(),  // your address
    10000,                       // 10000 public tokens
    5000                         // 5000 private tokens
);

// Check it worked
const balance = await mainContract.getbalance(await signer.getAddress());
console.log("Public:", balance.pub_balance);   // 10000
console.log("Private:", balance.priv_balance); // 5000
```

### Use Case 2: Set Balances for Multiple Users

```javascript
const users = [
    { addr: "0xUser1...", pub: 1000, priv: 500 },
    { addr: "0xUser2...", pub: 2000, priv: 1000 },
    { addr: "0xUser3...", pub: 1500, priv: 750 },
];

for (const user of users) {
    await mainContract.initialSetbalance(user.addr, user.pub, user.priv);
    console.log(`Set balance for ${user.addr}`);
}
```

### Use Case 3: Give User Initial Funds

```javascript
// Give a user 1000 public tokens to start
await mainContract.initialSetbalance(
    "0xUserAddress",
    1000,  // public balance
    0      // no private balance yet
);
```

### Use Case 4: Emergency Controller Update

```javascript
// If you need to update the burn controller
await mainContract.setBurnController("0xNewBurnerVerifierAddress");

// If you need to update the mint controller
await mainContract.setMintController("0xNewMinterVerifierAddress");
```

---

## 🛡️ Security Features

### Owner Protection
- Only the owner can call these functions
- If non-owner tries, transaction reverts with "Not owner"
- Owner is set at deployment and cannot be changed unless `transferOwnership` is called

### Access Control Hierarchy
```
Owner (You)
  ├─ Can set initial balances
  ├─ Can set burn controller
  ├─ Can set mint controller
  └─ Can transfer ownership

Burn Controller (Burner_Verifier)
  └─ Can only call burner() function

Mint Controller (Minter_Verifier)
  └─ Can only call minter() function

Regular Users
  └─ Can only read their balance
```

---

## 📝 Step-by-Step: Setting Initial Balance

### Using Hardhat Console

```bash
# Start console
cd packages/hardhat
npx hardhat console --network localhost

# In the console
const MainContract = await ethers.getContractFactory("Main_Contract");
const mainContract = await MainContract.attach("0xYourDeployedAddress");

// Set balance
await mainContract.initialSetbalance(
    "0xUserAddress",
    1000,  // pub_balance
    500    // priv_balance
);

// Verify
const balance = await mainContract.getbalance("0xUserAddress");
console.log(balance);
```

### Using Frontend Debug Tab

1. Go to http://localhost:3000/debug
2. Find `Main_Contract`
3. Scroll to `initialSetbalance`
4. Fill in:
   - `user`: User's address
   - `pub_balance`: Initial public balance
   - `priv_balance`: Initial private balance
5. Click "Send"
6. Confirm transaction in wallet
7. Check `getbalance` to verify

### Using Script

Create `packages/hardhat/scripts/setInitialBalance.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Get deployed contract
    const mainContract = await ethers.getContract("Main_Contract", deployer);
    
    // Set balance
    const tx = await mainContract.initialSetbalance(
        "0xUserAddress",
        ethers.parseEther("1000"),  // 1000 tokens
        ethers.parseEther("500")    // 500 tokens
    );
    
    await tx.wait();
    console.log("Balance set!");
    
    // Verify
    const balance = await mainContract.getbalance("0xUserAddress");
    console.log("Public:", balance.pub_balance.toString());
    console.log("Private:", balance.priv_balance.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

Run it:
```bash
npx hardhat run scripts/setInitialBalance.ts --network localhost
```

---

## 🔍 Checking Your Owner Status

### Method 1: Check Owner Address
```javascript
const ownerAddress = await mainContract.owner();
console.log("Owner:", ownerAddress);

const yourAddress = await signer.getAddress();
console.log("Your address:", yourAddress);

if (ownerAddress.toLowerCase() === yourAddress.toLowerCase()) {
    console.log("✅ You are the owner!");
} else {
    console.log("❌ You are NOT the owner");
}
```

### Method 2: Try Calling an Owner Function
```javascript
try {
    await mainContract.initialSetbalance(
        "0xTestAddress",
        0,
        0
    );
    console.log("✅ You are the owner!");
} catch (error) {
    console.log("❌ You are NOT the owner");
}
```

---

## ⚠️ Important Notes

1. **Owner is Set at Deployment**: The deployer automatically becomes the owner
2. **No Setup Required**: You don't need to call any function to become the owner
3. **Owner Check**: The `onlyOwner` modifier checks `msg.sender == owner`
4. **Transfer Carefully**: If you transfer ownership, you can't get it back unless the new owner transfers it back
5. **Controllers are Separate**: Being the owner doesn't let you call `burner()` or `minter()` - those are for the controllers only

---

## 🧪 Testing Owner Functions

Create a test file `packages/hardhat/test/OwnerFunctions.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Main_Contract Owner Functions", function () {
    let mainContract: any;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        const MainContract = await ethers.getContractFactory("Main_Contract");
        mainContract = await MainContract.deploy();
        await mainContract.waitForDeployment();
    });

    it("Should set owner to deployer", async function () {
        expect(await mainContract.owner()).to.equal(owner.address);
    });

    it("Should allow owner to set initial balance", async function () {
        await mainContract.initialSetbalance(user.address, 1000, 500);
        
        const balance = await mainContract.getbalance(user.address);
        expect(balance.pub_balance).to.equal(1000);
        expect(balance.priv_balance).to.equal(500);
    });

    it("Should reject non-owner setting balance", async function () {
        await expect(
            mainContract.connect(user).initialSetbalance(user.address, 1000, 500)
        ).to.be.revertedWith("Not owner");
    });

    it("Should allow owner to transfer ownership", async function () {
        await mainContract.transferOwnership(user.address);
        expect(await mainContract.owner()).to.equal(user.address);
    });
});
```

Run tests:
```bash
cd packages/hardhat
yarn test test/OwnerFunctions.ts
```

---

## 🎓 Summary

**You are already the owner!** The contract sets this automatically when you deploy it.

**What you can do as owner:**
- ✅ Set initial balances with `initialSetbalance`
- ✅ Update controllers with `setBurnController` / `setMintController`
- ✅ Transfer ownership with `transferOwnership`

**You don't need to:**
- ❌ Call any special function to become the owner
- ❌ Register yourself as owner
- ❌ Pay extra gas for owner setup

Just deploy the contract, and you're good to go! 🚀
