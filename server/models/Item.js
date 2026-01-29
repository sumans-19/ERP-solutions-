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
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  quantity: {
    type: String,
    default: ''
  },
  unit: {
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

const stageInspectionCheckSchema = new mongoose.Schema({
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

const finalQualityCheckSchema = new mongoose.Schema({
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
  itemType: {
    type: String,
    enum: ['raw-material', 'finished-good', 'semi-finished', 'consumable'],
    default: 'finished-good'
  },
  generalNote: {
    type: String,
    trim: true,
    default: ''
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

  // Stage Inspection Check Section
  stageInspectionChecks: [stageInspectionCheckSchema],

  // Final Quality Check Section
  finalQualityCheck: [finalQualityCheckSchema],

  // Single image upload for Final Quality Check
  qualityCheckImage: {
    type: String,
    default: ''
  },



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
      enum: ['assigned', 'pending', 'in-progress', 'completed', 'failed'],
      default: 'assigned'
    },
    notes: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Method to calculate and update item state based on progress
itemSchema.methods.calculateState = function () {
  // Handle case where processes don't exist
  if (!this.processes || this.processes.length === 0) {
    return this.state || 'New';
  }

  // Include both execution and testing steps
  const mfgSteps = this.processes.filter(p => p.stepType === 'execution' || p.stepType === 'testing');

  if (mfgSteps.length === 0) {
    return 'New';
  }

  const assignedEmployees = this.assignedEmployees || [];

  // Count assigned steps
  const assignedCount = assignedEmployees.filter(a =>
    mfgSteps.some(s => s.id === a.processStepId)
  ).length;

  // Count exactly how many steps are marked 'completed'
  const completedMfgSteps = assignedEmployees.filter(a =>
    a.status === 'completed' && mfgSteps.some(s => s.id === a.processStepId)
  ).length;

  // Check if any step is 'in-progress'
  const inProgressCount = assignedEmployees.filter(a =>
    a.status === 'in-progress'
  ).length;

  // 1. Hold State Override
  if (this.state === 'Hold') return 'Hold';

  // 2. New: No steps assigned yet
  if (assignedCount === 0) return 'New';

  // 3. Assigned: Steps assigned but none started or completed
  if (completedMfgSteps === 0 && inProgressCount === 0) return 'Assigned';

  // 4. Manufacturing: Work has started but not all steps are done
  if (completedMfgSteps < mfgSteps.length) return 'Manufacturing';

  // 5. Post-Production Transitions (Verification -> Documentation -> Completed)
  if (completedMfgSteps >= mfgSteps.length) {
    // Check if Verification is needed (if checks exist and aren't all passed)
    const stageInspectionChecks = this.stageInspectionChecks || [];
    const needsVerification = stageInspectionChecks.length > 0 &&
      !stageInspectionChecks.every(c => c.status === 'passed');

    if (needsVerification) return 'Verification';

    // Check if Documentation is needed (if fields exist and aren't all filled)
    const finalQualityCheck = this.finalQualityCheck || [];
    const needsDocumentation = finalQualityCheck.length > 0 &&
      !finalQualityCheck.every(f => f.remarks && f.remarks.trim() !== '');

    if (needsDocumentation) return 'Documentation';

    // 6. Final State
    return 'Completed';
  }

  return this.state;
};

// Pre-save hook to auto-update state
itemSchema.pre('save', async function () {
  if (this.isNew && this.openingQty) {
    this.currentStock = parseFloat(this.openingQty) || 0;
  }

  // Auto-calculate state if not manually set to Hold
  const shouldRecalculate =
    this.isModified('assignedEmployees') ||
    this.isModified('processes') ||
    this.isModified('stageInspectionChecks') ||
    this.isModified('finalQualityCheck') ||
    this.isModified('state');

  if (shouldRecalculate || this.isNew) {
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