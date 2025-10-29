const { buildPoseidon } = require("circomlibjs");

async function computeCommitments() {
  const poseidon = await buildPoseidon();
  
  // Input values
  const secret = BigInt("11111");
  const privateBalance = BigInt("100");
  const spendAmount = BigInt("10");
  const newBalance = privateBalance + spendAmount; // 110
  
  // Compute old commitment: Poseidon(secret, private_balance)
  const oldCommitment = poseidon.F.toString(poseidon([secret, privateBalance]));
  
  // Compute new commitment: Poseidon(secret, new_balance)
  const newCommitment = poseidon.F.toString(poseidon([secret, newBalance]));
  
  console.log("Old Commitment:", oldCommitment);
  console.log("New Commitment:", newCommitment);
  console.log("\nComplete input.json:");
  console.log(JSON.stringify({
    old_commitment: oldCommitment,
    new_commitment: newCommitment,
    secret: secret.toString(),
    randomness: "22222",
    private_balance: privateBalance.toString(),
    spend_amount: spendAmount.toString()
  }, null, 2));
}

computeCommitments().catch(console.error);
