// models/cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        refPath: 'items.category' // Tùy theo category mà liên kết model MonAn hoặc MonNuoc
      },
      category: { 
        type: String, 
        enum: ['MonAn', 'MonNuoc'], 
        required: true 
      },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
