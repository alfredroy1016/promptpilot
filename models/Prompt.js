const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: false },
  useCase: { type: String, required: true },
  content: { type: String, required: false },
  file: { type: String, default: null },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prompt', PromptSchema);


