const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  address: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  blockNumber: { type: Number, required: true },
  timeStamp: { type: Date, required: true },
  value: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
});

module.exports = mongoose.model("Transaction", transactionSchema);
