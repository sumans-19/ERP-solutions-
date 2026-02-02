const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    itemCode: {
        type: String,
        required: true,
        trim: true
    },
    itemName: String,
    changeType: {
        type: String,
        enum: ['Add', 'Edit', 'Delete', 'Stock Adjustment', 'Consumption', 'GRN', 'GRN Edit (Reverse)', 'GRN Edit (Apply)', 'Status Revoke', 'MR Approval', 'Production Movement'],
        required: true
    },
    oldQty: {
        type: Number,
        default: 0
    },
    newQty: {
        type: Number,
        required: true
    },
    changeQty: {
        type: Number,
        required: true
    },
    reason: String,
    remark: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: String,
    referenceId: {
        type: mongoose.Schema.Types.ObjectId, // Can be GRN ID, MR ID, etc.
        refPath: 'referenceModel'
    },
    referenceModel: {
        type: String,
        enum: ['GRN', 'MaterialRequest', 'JobCard', 'RawMaterial']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
