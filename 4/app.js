require("dotenv").config();
const express = require("express");
const Web3 = require("web3");

const app = express();
const web3 = new Web3(process.env.INFURA_API_URL);

// Sample ERC-20 ABI (minimal interface for balanceOf)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

app.use(express.json());

// API Endpoint
app.get("/api/token-balance", async (req, res) => {
  const { tokenAddress, walletAddress } = req.query;

  // Validate Ethereum addresses
  if (!web3.utils.isAddress(tokenAddress) || !web3.utils.isAddress(walletAddress)) {
    return res.status(400).json({ error: "Invalid token or wallet address" });
  }

  try {
    // Initialize the token contract
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);

    // Get the balance and decimals
    const balance = await tokenContract.methods.balanceOf(walletAddress).call();
    const decimals = await tokenContract.methods.decimals().call();

    // Convert balance to human-readable format
    const formattedBalance = balance / Math.pow(10, decimals);

    res.status(200).json({
      network: "Goerli Testnet",
      tokenAddress,
      walletAddress,
      balance: formattedBalance,
    });
  } catch (error) {
    console.error("Error fetching token balance:", error.message);
    res.status(500).json({ error: "Failed to fetch token balance" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
