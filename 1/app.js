require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Web3 = require("web3");
const fetch = require("node-fetch");

const app = express();
const web3 = new Web3(process.env.INFURA_API_URL);

// MongoDB Schema and Model
const nftSchema = new mongoose.Schema(
  {
    contractAddress: String,
    tokenId: String,
    name: String,
    description: String,
    image: String,
  },
  { timestamps: true }
);

const NFT = mongoose.model("NFT", nftSchema);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Minimal ERC-721 ABI for `tokenURI`
const ERC721_ABI = [
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "uri", type: "string" }],
    type: "function",
  },
];

// API Endpoint
app.get("/api/nft-metadata", async (req, res) => {
  const { contractAddress, tokenId } = req.query;

  if (!web3.utils.isAddress(contractAddress) || !tokenId) {
    return res.status(400).json({ error: "Invalid contract address or token ID" });
  }

  try {
    // Check if metadata exists in the database
    const existingNFT = await NFT.findOne({ contractAddress, tokenId });
    if (existingNFT) {
      return res.status(200).json({ metadata: existingNFT });
    }

    // Interact with the smart contract to get the token URI
    const nftContract = new web3.eth.Contract(ERC721_ABI, contractAddress);
    const tokenURI = await nftContract.methods.tokenURI(tokenId).call();

    // Fetch metadata from the token URI (assumes it's a public HTTP endpoint)
    const metadataResponse = await fetch(tokenURI);
    if (!metadataResponse.ok) {
      throw new Error("Failed to fetch metadata from token URI");
    }

    const metadata = await metadataResponse.json();

    // Store metadata in MongoDB
    const nft = new NFT({
      contractAddress,
      tokenId,
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
    });
    await nft.save();

    res.status(200).json({ metadata: nft });
  } catch (error) {
    console.error("Error fetching NFT metadata:", error.message);
    res.status(500).json({ error: "Failed to fetch NFT metadata" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
