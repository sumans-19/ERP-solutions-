const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Employee = require('../models/Employee');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const { checkPermission } = require('../middleware/permissions');
const authenticateToken = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get items assigned to a specific employee
router.get('/assigned/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const items = await Item.find({
      'assignedEmployees.employeeId': employeeId
    }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all items
router.get('/', checkPermission('viewItems'), async (req, res) => {
  try {
    // Exclude image field from list to reduce payload size and improve performance
    const items = await Item.find().select('-image').sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item
router.get('/:id', checkPermission('viewItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions for a specific item
router.get('/:id/transactions', checkPermission('viewItems'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let transactions = [];

    // 1. Add Opening Stock as first transaction
    if (item.openingQty && parseFloat(item.openingQty) > 0) {
      transactions.push({
        id: 'opening',
        type: 'Opening Stock',
        ref: 'Opening',
        partyName: 'Opening Stock',
        date: item.asOfDate || item.createdAt,
        quantity: parseFloat(item.openingQty),
        rate: parseFloat(item.atPrice) || 0,
        status: 'Completed',
      });
    }

    // 2. Find Sales
    const sales = await Sale.find({ "items.item": itemId }).populate('party', 'name');
    sales.forEach(sale => {
      const itemInSale = sale.items.find(i => i.item.toString() === itemId);
      if (itemInSale) {
        transactions.push({
          id: `sale-${sale._id}`,
          type: 'Sale',
          ref: sale.invoiceNumber,
          partyName: sale.party?.name || 'N/A',
          date: sale.invoiceDate,
          quantity: -itemInSale.quantity, // Negative for sale
          rate: itemInSale.rate,
          status: sale.paymentStatus,
        });
      }
    });

    // 3. Find Purchases
    const purchases = await Purchase.find({ "items.item": itemId }).populate('party', 'name');
    purchases.forEach(purchase => {
      const itemInPurchase = purchase.items.find(i => i.item.toString() === itemId);
      if (itemInPurchase) {
        transactions.push({
          id: `purchase-${purchase._id}`,
          type: 'Purchase',
          ref: purchase.billNumber,
          partyName: purchase.party?.name || 'N/A',
          date: purchase.billDate,
          quantity: itemInPurchase.quantity, // Positive for purchase
          rate: itemInPurchase.rate,
          status: purchase.paymentStatus,
        });
      }
    });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching item transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create item
router.post('/', checkPermission('createItems'), async (req, res) => {
  try {
    console.log('Received item data:', JSON.stringify(req.body, null, 2));
    const item = new Item(req.body);
    const newItem = await item.save();
    console.log('Item saved successfully:', newItem._id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(400).json({ message: error.message, error: error.toString() });
  }
});

// Update item
router.put('/:id', checkPermission('editItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    Object.assign(item, req.body);
    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete item
router.delete('/:id', checkPermission('deleteItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await item.deleteOne();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: error.message });
  }
});

// ===== STATE MANAGEMENT ROUTES =====

// Get items by state
router.get('/state/:state', checkPermission('viewItems'), async (req, res) => {
  try {
    const { state } = req.params;
    const items = await Item.find({ state }).select('-image').sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get state counts for all items
router.get('/stats/state-counts', checkPermission('viewItems'), async (req, res) => {
  try {
    const counts = await Item.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 }
        }
      }
    ]);

    const stateCounts = {
      New: 0,
      Assigned: 0,
      Manufacturing: 0,
      Verification: 0,
      Documentation: 0,
      Completed: 0,
      Hold: 0
    };

    counts.forEach(c => {
      if (stateCounts.hasOwnProperty(c._id)) {
        stateCounts[c._id] = c.count;
      }
    });

    res.json(stateCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middle routes continue...


// Start working on a step
router.post('/:id/start-step', checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const assignment = item.assignedEmployees.find(a => Number(a.processStepId) === processStepId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = 'in-progress';
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete a manufacturing step
router.post('/:id/complete-step', checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const assignment = item.assignedEmployees.find(a => Number(a.processStepId) === processStepId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = 'completed';
    assignment.completedAt = new Date();

    // Update process step status
    const processStep = item.processes.find(p => Number(p.id) === processStepId);
    if (processStep) {
      processStep.status = 'completed';
    }

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle substep status
router.post('/:id/toggle-substep', authenticateToken, checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const subStepId = Number(req.body.subStepId);
    const status = req.body.status;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const processStep = item.processes.find(p => Number(p.id) === processStepId);
    if (!processStep) return res.status(404).json({ message: 'Process step not found' });

    const subStep = processStep.subSteps.find(s => Number(s.id) === subStepId);
    if (!subStep) return res.status(404).json({ message: 'Substep not found' });

    subStep.status = status;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save step note
router.post('/:id/save-step-note', authenticateToken, checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const { notes, employeeId } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const assignment = item.assignedEmployees.find(a => Number(a.processStepId) === processStepId && a.employeeId === employeeId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.notes = notes;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark step as failed and put item on hold
router.post('/:id/fail-step', checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const { reason } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const assignment = item.assignedEmployees.find(a => Number(a.processStepId) === processStepId);
    if (assignment) {
      assignment.status = 'failed';
    }

    item.state = 'Hold';
    item.holdReason = reason || 'Step failed quality check';
    item.stateHistory.push({
      state: 'Hold',
      changedAt: new Date(),
      changedBy: req.user?.name || 'system',
      reason: reason || 'Step failed'
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Put item on hold
router.post('/:id/hold', checkPermission('editItems'), async (req, res) => {
  try {
    const { reason } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.state = 'Hold';
    item.holdReason = reason || 'Manual hold';
    item.stateHistory.push({
      state: 'Hold',
      changedAt: new Date(),
      changedBy: req.user?.name || 'system',
      reason: reason || 'Manual hold'
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resume item from hold
router.post('/:id/resume', checkPermission('editItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.state !== 'Hold') {
      return res.status(400).json({ message: 'Item is not on hold' });
    }

    // Calculate what state it should be in
    const newState = item.calculateState();
    item.state = newState === 'Hold' ? 'Manufacturing' : newState; // Default to Manufacturing if still calculating as Hold
    item.holdReason = '';
    item.stateHistory.push({
      state: item.state,
      changedAt: new Date(),
      changedBy: req.user?.name || 'system',
      reason: 'Resumed from hold'
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete verification (pass all stage inspection checks)
router.post('/:id/complete-verification', checkPermission('editItems'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Mark all stage inspection checks as passed
    item.stageInspectionChecks.forEach(check => {
      check.status = 'passed';
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete documentation
router.post('/:id/complete-documentation', checkPermission('editItems'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Add remarks to all final quality check items
    item.finalQualityCheck.forEach(fi => {
      if (!fi.remarks) {
        fi.remarks = remarks || 'Documentation completed';
      }
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// POST /:id/assign-step - Assign employee to a manufacturing step
router.post('/:id/assign-step', authenticateToken, checkPermission('editItems'), async (req, res) => {
  try {
    const processStepId = Number(req.body.processStepId);
    const { employeeId, employeeName, expectedCompletionDate } = req.body;
    console.log(`[AssignStep] Assigning step ${processStepId} of item ${req.params.id} to ${employeeName} (${employeeId})`);

    if (isNaN(processStepId) || !employeeId || !employeeName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if step already assigned
    const existingAssignment = item.assignedEmployees.find(
      a => Number(a.processStepId) === processStepId
    );

    if (existingAssignment) {
      console.log(`[AssignStep] Step ${processStepId} already assigned to ${existingAssignment.employeeName}`);
      return res.status(400).json({ message: 'Step already assigned to an employee' });
    }

    // Create the assignment object
    const assignment = {
      processStepId,
      employeeId,
      employeeName,
      assignedAt: new Date(),
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
      status: 'pending'
    };

    // Add assignment to Item
    item.assignedEmployees.push(assignment);

    // Recalculate item state
    const oldState = item.state;
    const newState = item.calculateState();
    if (newState !== oldState) {
      item.state = newState;
      item.stateHistory.push({
        state: newState,
        changedAt: new Date(),
        changedBy: req.user?.username || req.user?.role || 'system',
        reason: `Step assigned to ${employeeName}`
      });
      console.log(`[AssignStep] Item state changed from ${oldState} to ${newState}`);
    }

    // Update Employee model
    const employee = await Employee.findById(employeeId);
    if (employee) {
      const stepDetails = item.processes.find(p => Number(p.id) === processStepId);

      employee.currentAssignments.push({
        orderId: item._id.toString(),
        processName: stepDetails ? stepDetails.stepName : 'Manufacturing Step',
        assignedAt: new Date()
      });

      if (employee.calculatedStatus === 'Available') {
        employee.calculatedStatus = 'Busy';
      }

      await employee.save();
      console.log(`[AssignStep] Updated employee ${employeeName} assignments`);
    } else {
      console.warn(`[AssignStep] Employee ${employeeId} not found in database!`);
    }

    await item.save();
    console.log(`[AssignStep] Successfully saved item process mapping`);
    res.json({ message: 'Step assigned successfully', item });
  } catch (error) {
    console.error('Error in assign-step:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;