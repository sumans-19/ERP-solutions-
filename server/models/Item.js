const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  materialName: {
    type: String,
    trim: true
  },
  quantity: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    trim: true
  },
  costPerUnit: {
    type: String,
    default: ''
  },
  supplier: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  usedInProcessStep: {
    type: Number,
    default: null
  }
}, { _id: false });

const inspectionCheckSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  checkName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  checkType: {
    type: String,
    enum: ['visual', 'measurement', 'functional', 'other'],
    default: 'visual'
  },
  acceptanceCriteria: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  }
}, { _id: false });

const finalInspectionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  parameter: {
    type: String,
    trim: true,
    default: ''
  },
  tolerance: {
    type: String,
    trim: true,
    default: ''
  },
  inspectionImage: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const subStepSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
}, { _id: false });

const processStepSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  stepName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subSteps: [subStepSchema],
  stepType: {
    type: String,
    enum: ['execution', 'testing'],
    default: 'execution'
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  // Basic Information
  type: {
    type: String,
    enum: ['product'],
    default: 'product'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  hsn: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String
  },

  // Pricing Section
  salePrice: {
    type: String,
    default: ''
  },
  salePriceTaxType: {
    type: String,
    enum: ['without', 'with'],
    default: 'without'
  },
  saleDiscountType: {
    type: String,
    enum: ['percentage', 'flat'],
    default: 'percentage'
  },
  purchasePrice: {
    type: String,
    default: ''
  },
  purchasePriceTaxType: {
    type: String,
    enum: ['without', 'with'],
    default: 'without'
  },
  taxRate: {
    type: String,
    default: 'None'
  },

  // Stock Section
  openingQty: {
    type: String,
    default: ''
  },
  atPrice: {
    type: String,
    default: ''
  },
  asOfDate: {
    type: Date
  },
  minStock: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true
  },

  // Current Stock - for tracking real-time inventory
  currentStock: {
    type: Number,
    default: 0
  },

  // Processes Section - Manufacturing steps
  processes: [processStepSchema],

  // Raw Materials Section
  rawMaterials: [rawMaterialSchema],

  // Inspection Check Section
  inspectionChecks: [inspectionCheckSchema],

  // Final Inspection Section
  finalInspection: [finalInspectionSchema],

  // State Management - Item Lifecycle
  state: {
    type: String,
    enum: ['New', 'Assigned', 'Manufacturing', 'Verification', 'Documentation', 'Completed', 'Hold'],
    default: 'New'
  },
  stateHistory: [{
    state: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    reason: String
  }],
  holdReason: {
    type: String,
    default: ''
  },
  assignedEmployees: [{
    processStepId: Number,
    employeeId: String,
    employeeName: String,
    assignedAt: Date,
    expectedCompletionDate: Date,
    completedAt: Date,
    status: {
      type: String,
      enum: ['assigned', 'in-progress', 'completed', 'failed'],
      default: 'assigned'
    }
  }]
}, {
  timestamps: true
});

// Method to calculate and update item state based on progress
itemSchema.methods.calculateState = function () {
  // Handle case where processes don't exist
  if (!this.processes || this.processes.length === 0) {
    return 'New';
  }

  // Include both execution and testing steps
  const mfgSteps = this.processes.filter(p => p.stepType === 'execution' || p.stepType === 'testing');

  if (mfgSteps.length === 0) {
    return 'New';
  }

  const assignedEmployees = this.assignedEmployees || [];

  const assignedCount = assignedEmployees.filter(a =>
    mfgSteps.some(s => s.id === a.processStepId)
  ).length;
  const completedMfgSteps = assignedEmployees.filter(a =>
    a.status === 'completed' && mfgSteps.some(s => s.id === a.processStepId)
  ).length;

  // Check if on hold
  if (this.state === 'Hold') {
    return 'Hold';
  }

  // New: No assignments
  if (assignedCount === 0) {
    return 'New';
  }

  // Assigned: All mfg steps assigned but none started
  const inProgressCount = assignedEmployees.filter(a =>
    a.status === 'in-progress' || a.status === 'completed'
  ).length;
  if (assignedCount === mfgSteps.length && inProgressCount === 0) {
    return 'Assigned';
  }

  // Manufacturing: At least one started, not all completed
  if (completedMfgSteps < mfgSteps.length && inProgressCount > 0) {
    return 'Manufacturing';
  }

  // Verification: All mfg steps completed
  if (completedMfgSteps === mfgSteps.length) {
    const inspectionChecks = this.inspectionChecks || [];
    const verificationDone = inspectionChecks.length > 0 && inspectionChecks.every(c => c.status === 'passed');
    if (!verificationDone) {
      return 'Verification';
    }

    // Documentation: Verification passed
    const finalInspection = this.finalInspection || [];
    const docDone = finalInspection.length > 0 &&
      finalInspection.every(f => f.remarks);
    if (!docDone) {
      return 'Documentation';
    }

    // Completed: Everything done
    return 'Completed';
  }

  return this.state; // Fallback to current state
};

// Pre-save hook to auto-update state
itemSchema.pre('save', async function () {
  if (this.isNew && this.openingQty) {
    this.currentStock = parseFloat(this.openingQty) || 0;
  }

  // Auto-calculate state if not manually set to Hold
  if (!this.isNew || this.isModified('assignedEmployees') || this.isModified('processes')) {
    const newState = this.calculateState();
    if (newState !== this.state && this.state !== 'Hold') {
      this.stateHistory.push({
        state: newState,
        changedAt: new Date(),
        changedBy: 'system',
        reason: 'Auto-calculated based on progress'
      });
      this.state = newState;
    }
  }
});

// Add indexes for frequently queried fields
itemSchema.index({ createdAt: -1 });
itemSchema.index({ name: 1 });
itemSchema.index({ code: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ state: 1 });

module.exports = mongoose.model('Item', itemSchema);