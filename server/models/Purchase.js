const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
  },
  items: [purchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partially Paid'],
    default: 'Unpaid'
  },
  notes: String
}, {
  timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
