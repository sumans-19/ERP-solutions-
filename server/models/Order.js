const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  unit: {
    type: String,
    trim: true,
    default: 'NONE'
  },
  rate: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['Normal', 'High'],
    default: 'Normal'
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  partyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  poNumber: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  poDate: {
    type: Date,
    required: true
  },
  estimatedDeliveryDate: {
    type: Date
  },
  items: [orderItemSchema],
  totalQty: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['New', 'Confirmed', 'Processing', 'Completed', 'Cancelled'],
    default: 'New',
    index: true
  },
  assignedTo: {
    type: String,
    trim: true,
    index: true
  },
  assignedDate: {
    type: Date
  },
  completionPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true });

// Pre-save hook to calculate totals
orderSchema.pre('save', async function() {
  try {
    this.totalQty = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    throw error;
  }
});

// Index for createdAt (timestamps)
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
