const { buildPoseidon } = require("circomlibjs");

async function generateTestInput() {
  const poseidon = await buildPoseidon();
  
  // Test scenario: User has 50 ETH public, 0 ETH private, wants to spend 40 ETH
  const publicBalance = BigInt("50000000000000000000"); // 50 ETH in wei
  const privateBalance = BigInt("0");
  const spendAmount = BigInt("40000000000000000000"); // 40 ETH in wei
  const secret = BigInt("99999");
  const randomness = BigInt("88888");
  
  // Calculate new balance (will be negative for burning, positive for minting)
  const newBalance = privateBalance - spendAmount; // 0 - 40 = -40 (for burn operation)
  
  // Compute old commitment: Poseidon(secret, private_balance)
  const oldCommitment = poseidon.F.toString(poseidon([secret, privateBalance]));
  
  // Compute new commitment: Poseidon(secret, new_balance)
  const newCommitment = poseidon.F.toString(poseidon([secret, newBalance]));
  
  console.log("=== Test Input Generation ===");
  console.log("Public Balance:", publicBalance.toString(), "wei (50 ETH)");
  console.log("Private Balance:", privateBalance.toString());
  console.log("Spend Amount:", spendAmount.toString(), "wei (40 ETH)");
  console.log("New Private Balance:", newBalance.toString());
  console.log("Secret:", secret.toString());
  console.log("Randomness:", randomness.toString());
  console.log("\nOld Commitment:", oldCommitment);
  console.log("New Commitment:", newCommitment);
  
  const input = {
    public_balance: publicBalance.toString(),
    old_commitment: oldCommitment,
    new_commitment: newCommitment,
    secret: secret.toString(),
    randomness: randomness.toString(),
    private_balance: privateBalance.toString(),
    spend_amount: spendAmount.toString()
  };
  
  console.log("\n=== Complete input.json ===");
  console.log(JSON.stringify(input, null, 2));
  
  return input;
}

generateTestInput().catch(console.error);
