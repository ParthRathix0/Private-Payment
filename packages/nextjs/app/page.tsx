"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Contract configuration
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
const CONTRACT_ABI = [
  "function getPublicBalance(address account) view returns (uint256)",
  "function getPrivateBalance(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function privateTransfer(address to, uint256 amount, bytes32 commitment) returns (bool)",
];

const Dashboard = () => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [publicBalance, setPublicBalance] = useState("0");
  const [privateBalance, setPrivateBalance] = useState("0");
  const [userAddress, setUserAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);

        // Fetch initial balances
        await updateBalances(contractInstance, address);

        // Listen for Transfer events
        contractInstance.on("Transfer", async (from, to) => {
          if (from === address || to === address) {
            await updateBalances(contractInstance, address);
          }
        });
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const updateBalances = async (contractInstance: ethers.Contract, address: string) => {
    try {
      const publicBal = await contractInstance.getPublicBalance(address);
      const privateBal = await contractInstance.getPrivateBalance(address);
      setPublicBalance(ethers.formatEther(publicBal));
      setPrivateBalance(ethers.formatEther(privateBal));
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const handleTransfer = async (isPrivate: boolean) => {
    if (!contract || !amount) return;

    setLoading(true);
    try {
      const tx = isPrivate
        ? await contract.privateTransfer(
            "RECIPIENT_ADDRESS",
            ethers.parseEther(amount),
            ethers.randomBytes(32), // Example commitment
          )
        : await contract.transfer("RECIPIENT_ADDRESS", ethers.parseEther(amount));

      await tx.wait();
      setShowSendModal(false);
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-teal-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">LOKI</h1>
          <p className="text-gray-600">A privacy-preserving protocol for transferring funds.</p>
        </div>

        {/* Account Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Account Overview</h2>
              <p className="text-gray-500">View your public and private balances</p>
            </div>
            {!userAddress ? (
              <button onClick={connectWallet} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                Connect Wallet
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Public Balance */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-600 mb-2">Public Balance</h3>
              <p className="text-4xl font-bold mb-2">{publicBalance} ETH</p>
              <p className="text-sm text-gray-500">Available across all chains</p>
            </div>

            {/* Private Balance */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg text-gray-600 mb-2">Private Balance</h3>
              <p className="text-4xl font-bold mb-2">{privateBalance} ETH</p>
              <div className="mt-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Randomness:</p>
                  <div className="flex items-center">
                    <code className="text-sm bg-gray-100 p-1 rounded">yhua9quovnh</code>
                    <button className="ml-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowSendModal(true)}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={!userAddress || loading}
            >
              {loading ? "Processing..." : "Send"}
            </button>
            <button
              className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={!userAddress || loading}
            >
              Generate Proof
            </button>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Send Funds</h3>
              <button onClick={() => setShowSendModal(false)}>×</button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Amount</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  placeholder="0.00 ETH"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-4">
                <button
                  className="w-full bg-gray-50 p-4 rounded-lg text-left flex justify-between items-center"
                  onClick={() => handleTransfer(false)}
                  disabled={loading}
                >
                  <div>
                    <p className="font-semibold">Public Send</p>
                    <p className="text-sm text-gray-500">Standard transaction</p>
                  </div>
                  <span className="text-gray-400">{publicBalance} ETH</span>
                </button>
                <button
                  className="w-full bg-gray-50 p-4 rounded-lg text-left flex justify-between items-center"
                  onClick={() => handleTransfer(true)}
                  disabled={loading}
                >
                  <div>
                    <p className="font-semibold">Private Send</p>
                    <p className="text-sm text-gray-500">Shielded transaction</p>
                  </div>
                  <span className="text-gray-400">{privateBalance} ETH</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
