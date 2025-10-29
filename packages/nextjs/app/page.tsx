"use client";

import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const toHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [publicBalance] = useState("125.50");
  const [privateBalance] = useState("89.75");
  const [randomness, setRandomness] = useState("owd3j2g8s9");
  const [sha256, setSha256] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // compute sha256 of randomness
    const compute = async () => {
      try {
        const enc = new TextEncoder();
        const data = enc.encode(randomness);
        const hash = await crypto.subtle.digest("SHA-256", data);
        setSha256(toHex(hash));
      } catch (e) {
        setSha256("");
      }
    };
    compute();
  }, [randomness]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  return (
    <div className="flex flex-col items-center w-full pt-12 px-6">
      <div className="max-w-5xl w-full">
        <h2 className="text-2xl font-semibold mb-2">Account Overview</h2>
        <p className="text-sm text-muted mb-6">View your public and private balances</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Balance Card */}
          <div className="bg-base-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm text-gray-500 mb-4">Public Balance</h3>
            <div className="text-4xl font-bold mb-2">${publicBalance}</div>
            <p className="text-sm text-gray-400">Available across all chains</p>
          </div>

          {/* Private Balance Card */}
          <div className="bg-base-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-sm text-gray-500 mb-4">Private Balance</h3>
            <div className="text-4xl font-bold mb-4">${privateBalance}</div>

            <label className="block text-xs text-gray-500 mb-2">Randomness:</label>
            <div className="flex items-center gap-2 mb-4">
              <input
                value={randomness}
                onChange={e => setRandomness(e.target.value)}
                className="flex-1 input input-bordered bg-base-200"
              />
              <button
                onClick={() => copyToClipboard(randomness, "randomness")}
                className="btn btn-ghost btn-square"
                aria-label="Copy randomness"
              >
                {copied === "randomness" ? "✓" : "Copy"}
              </button>
            </div>

            <label className="block text-xs text-gray-500 mb-2">SHA256 Hash:</label>
            <div className="flex items-start gap-2 mb-4">
              <textarea
                readOnly
                value={sha256}
                className="flex-1 textarea textarea-ghost bg-base-200 h-24 resize-none"
              />
              <button
                onClick={() => copyToClipboard(sha256, "sha256")}
                className="btn btn-ghost btn-square"
                aria-label="Copy sha256"
              >
                {copied === "sha256" ? "✓" : "Copy"}
              </button>
            </div>

            <p className="text-sm text-gray-400">Shielded funds with cryptographic commitment</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8 justify-center md:justify-start">
          <button className="btn btn-neutral px-8">Send</button>
          <button className="btn btn-outline px-6">Generate Proof</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
