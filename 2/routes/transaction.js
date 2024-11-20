const express = require("express");
const { fetchTransactions, getTransactions } = require("../controllers/transactionController");

const router = express.Router();

router.get("/fetch/:address", fetchTransactions); // Fetch last 5 transactions and store them
router.get("/query", getTransactions); // Query transactions by address and date

module.exports = router;
