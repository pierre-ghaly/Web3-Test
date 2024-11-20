const axios = require("axios");
const Transaction = require("../models/Transaction");

async function fetchTransactions(req, res) {
  const { address } = req.params;
  const { ETHERSCAN_API_KEY } = process.env;

  try {
    // Fetch transactions from Etherscan
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: "account",
        action: "txlist",
        address,
        startblock: 0,
        endblock: 99999999,
        sort: "desc",
        apikey: ETHERSCAN_API_KEY,
      },
    });

    const transactions = response.data.result.slice(0, 5);

    const transactionDocs = transactions.map((tx) => ({
      address,
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber, 10),
      timeStamp: new Date(tx.timeStamp * 1000), // Convert UNIX timestamp to Date
      value: tx.value,
      from: tx.from,
      to: tx.to,
    }));

    // Save to MongoDB
    await Transaction.insertMany(transactionDocs, { ordered: false })
      .then(() => console.log("Transactions saved to MongoDB successfully!"))
      .catch((error) => console.error("Error saving transactions:", error.message));

    res.status(200).json({ transactions: transactionDocs });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

// Query stored transactions
async function getTransactions(req, res) {
  const { address } = req.query;
  const { startDate, endDate } = req.query;

  const query = {
    address,
    ...(startDate && { timeStamp: { $gte: new Date(startDate) } }),
    ...(endDate && { timeStamp: { $lte: new Date(endDate) } }),
  };

  try {
    const transactions = await Transaction.find(query).sort({ timeStamp: -1 });
    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

module.exports = { fetchTransactions, getTransactions };
