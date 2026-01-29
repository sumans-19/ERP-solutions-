const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const JobCard = require('../models/JobCard');
const Employee = require('../models/Employee');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const Counter = require('../models/Counter');

// Helper to get auto-incrementing Job No
async function getNextJobNo() {
  const counter = await Counter.findOneAndUpdate(
    { id: 'jobNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  const sequence = counter.seq.toString().padStart(4, '0');
  return `JOB-${year}-${sequence}`;
}

// Apply authentication to all routes
router.use(authenticateToken);

// ==========================================
// ANALYTICS & STATS ROUTES (Specific first)
// ==========================================

// Get order stats by stage
router.get('/stats/stage-counts', checkPermission('viewOrders'), async (req, res) => {
  try {
    const counts = await Order.aggregate([
      { $group: { _id: '$orderStage', count: { $sum: 1 } } }
    ]);

    const stateCounts = {
      New: 0, Mapped: 0, Assigned: 0, Processing: 0, MFGCompleted: 0,
      FQC: 0, Documentation: 0, Packing: 0, Dispatch: 0, Completed: 0, OnHold: 0
    };

    counts.forEach(c => {
      const stage = c._id || 'New';
      if (stateCounts.hasOwnProperty(stage)) {
        stateCounts[stage] += c.count;
      } else {
        const matchedKey = Object.keys(stateCounts).find(k => k.toLowerCase() === stage.toLowerCase());
        if (matchedKey) stateCounts[matchedKey] += c.count;
      }
    });

    res.json(stateCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders by stage
router.get('/stage/:stage', checkPermission('viewOrders'), async (req, res) => {
  try {
    const { stage } = req.params;
    const orders = await Order.find({ orderStage: stage })
      .populate('items.item', 'name code unit salePrice')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/tree-view
router.get('/tree-view', checkPermission('viewOrders'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.item', 'name code')
      .lean();

    const treeData = [];
    const companies = [...new Set(orders.map(o => o.partyName))];

    for (const company of companies) {
      const companyOrders = orders.filter(o => o.partyName === company);
      const orderNodes = [];

      for (const order of companyOrders) {
        const itemNodes = [];

        for (const item of order.items) {
          const jobCards = await JobCard.find({
            orderId: order._id,
            orderItemId: item._id
          }).populate({
            path: 'steps.employeeId',
            select: 'fullName'
          }).lean();

          itemNodes.push({
            id: item._id,
            type: 'item',
            name: item.itemName,
            partNo: item.item?.code || 'N/A',
            quantity: item.quantity,
            deliveryDate: item.deliveryDate,
            status: item.qcStatus || 'Pending',
            progress: calculateItemProgress(item, jobCards),
            jobs: jobCards.map(j => ({
              id: j._id,
              type: 'job',
              jobNumber: j.jobNumber,
              quantity: j.quantity,
              status: j.status,
              stage: j.stage,
              steps: j.steps
            }))
          });
        }

        orderNodes.push({
          id: order._id,
          type: 'order',
          poNumber: order.poNumber || 'No PO',
          date: order.poDate,
          stage: order.orderStage,
          status: order.status,
          items: itemNodes
        });
      }

      treeData.push({
        id: company,
        type: 'company',
        name: company,
        orders: orderNodes
      });
    }

    res.json(treeData);
  } catch (error) {
    console.error('Tree View API Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// STANDARD CRUD ROUTES
// ==========================================

function calculateItemProgress(item, jobs) {
  if (!jobs || jobs.length === 0) return 0;
  const totalSteps = jobs.reduce((sum, j) => sum + j.steps.length, 0);
  const completedSteps = jobs.reduce((sum, j) => sum + j.steps.filter(s => s.status === 'completed').length, 0);
  return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
}

// Get all orders
router.get('/', checkPermission('viewOrders'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.item', 'name code unit salePrice')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', checkPermission('viewOrders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.item', 'name code unit salePrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create order
router.post('/', checkPermission('createOrders'), async (req, res) => {
  try {
    const {
      partyName,
      poNumber,
      poDate,
      estimatedDeliveryDate,
      items,
      notes,
      status
    } = req.body;

    // Validate required fields
    if (!partyName || !poDate || !items || items.length === 0) {
      return res.status(400).json({
        message: 'Customer name, PO date, and at least one item are required'
      });
    }

    // Validate items
    const processedItems = items.map(item => {
      if (!item.itemName || item.itemName.trim() === '') {
        throw new Error('Item name is required for all items');
      }
      return {
        item: item.item || null,
        itemName: item.itemName.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'NONE',
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
        priority: item.priority || 'Normal',
        priority: item.priority || 'Normal',
        manufacturingSteps: (item.manufacturingSteps || []).map(step => ({
          ...step,
          targetStartDate: step.targetStartDate ? new Date(step.targetStartDate) : null,
          targetDeadline: step.targetDeadline ? new Date(step.targetDeadline) : null
        }))
      };
    });

    const newOrder = new Order({
      partyName: partyName.trim(),
      poNumber: poNumber?.trim() || '',
      poDate: new Date(poDate),
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      items: processedItems,
      notes: notes?.trim() || '',
      status: status || 'New',
      orderStage: 'New'
    });

    const savedOrder = await newOrder.save();

    // Auto-generate Job Cards immediately for New orders too
    console.log(`🚀 Generatng Job Cards for New Order: ${savedOrder._id}`);
    for (const orderItem of savedOrder.items) {
      const jobNumber = await getNextJobNo();
      const newJobCard = new JobCard({
        jobNumber,
        orderId: savedOrder._id,
        orderItemId: orderItem._id,
        itemId: orderItem.item,
        quantity: orderItem.quantity,
        priority: orderItem.priority,
        deliveryDate: orderItem.deliveryDate,
        stage: 'New',
        stageHistory: [{ stage: 'New', changedAt: new Date(), description: 'Initial Creation' }],
        status: 'Created',
        steps: (orderItem.manufacturingSteps || []).map(s => ({
          stepId: s.id,
          stepName: s.stepName,
          employeeId: s.employeeId,
          targetStartDate: s.targetStartDate,
          targetDeadline: s.targetDeadline,
          status: 'pending',
          subSteps: (s.subSteps || []).map(ss => ({
            id: ss.id,
            name: ss.name,
            description: ss.description,
            status: 'pending'
          }))
        }))
      });

      const calculatedStage = newJobCard.calculateStage();
      newJobCard.stage = calculatedStage;
      if (calculatedStage !== 'New') {
        newJobCard.stageHistory.push({ stage: calculatedStage, changedAt: new Date(), description: 'Auto-calculated at creation' });
      }

      const savedJob = await newJobCard.save();

      orderItem.jobBatches.push({
        jobId: savedJob._id,
        jobNumber: savedJob.jobNumber,
        batchQty: savedJob.quantity,
        status: 'Pending'
      });

      if (newJobCard.steps) {
        for (const step of newJobCard.steps) {
          if (step.employeeId) {
            await Employee.findByIdAndUpdate(step.employeeId, {
              $push: {
                currentAssignments: {
                  orderId: savedOrder._id,
                  processName: step.stepName,
                  assignedAt: new Date()
                }
              },
              $set: { calculatedStatus: 'Busy' }
            });
          }
        }
      }
    }

    await savedOrder.save();
    await savedOrder.populate('items.item', 'name code unit salePrice');

    res.status(201).json({
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order
router.put('/:id', checkPermission('editOrders'), async (req, res) => {
  try {
    const {
      partyName,
      poNumber,
      poDate,
      estimatedDeliveryDate,
      items,
      notes,
      status
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update fields
    if (partyName) order.partyName = partyName.trim();
    if (poNumber !== undefined) order.poNumber = poNumber.trim();
    if (poDate) order.poDate = new Date(poDate);
    if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    if (notes !== undefined) order.notes = notes.trim();
    if (status) order.status = status;

    // Update items if provided
    if (items && items.length > 0) {
      order.items = items.map(item => ({
        item: item.item || null,
        itemName: item.itemName.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || 'NONE',
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
        priority: item.priority || 'Normal',
        priority: item.priority || 'Normal',
        manufacturingSteps: (item.manufacturingSteps || []).map(step => ({
          ...step,
          targetStartDate: step.targetStartDate ? new Date(step.targetStartDate) : null,
          targetDeadline: step.targetDeadline ? new Date(step.targetDeadline) : null
        }))
      }));
    }

    await order.save();
    await order.populate('items.item', 'name code unit salePrice');

    res.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete order
router.delete('/:id', checkPermission('deleteOrders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', checkPermission('editOrders'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id)
      .populate('items.item', 'name code unit salePrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Trigger Job Card generation if status moved to 'Confirmed' or 'Processing'
    // This allows production planning to start as soon as the order is confirmed
    if ((status === 'Confirmed' || status === 'Processing') && !order.items.some(i => i.jobBatches && i.jobBatches.length > 0)) {
      console.log(`🚀 Generating Job Cards for Order: ${order._id} (Status: ${status})`);

      for (const orderItem of order.items) {
        // Skip if job card already exists for this item (simplified check)
        if (orderItem.jobBatches && orderItem.jobBatches.length > 0) continue;

        const jobNumber = await getNextJobNo();

        const newJobCard = new JobCard({
          jobNumber,
          orderId: order._id,
          orderItemId: orderItem._id,
          itemId: orderItem.item,
          quantity: orderItem.quantity,
          priority: orderItem.priority,
          deliveryDate: orderItem.deliveryDate,
          steps: orderItem.manufacturingSteps.map(s => ({
            stepId: s.id,
            stepName: s.stepName,
            employeeId: s.employeeId,
            targetStartDate: s.targetStartDate,
            targetDeadline: s.targetDeadline,
            status: 'pending',
            subSteps: (s.subSteps || []).map(ss => ({
              id: ss.id,
              name: ss.name,
              description: ss.description,
              status: 'pending'
            }))
          }))
        });

        const savedJob = await newJobCard.save();

        // Sync with Employee model for each assigned step
        for (const step of orderItem.manufacturingSteps) {
          if (step.employeeId) {
            try {
              await Employee.findByIdAndUpdate(step.employeeId, {
                $push: {
                  currentAssignments: {
                    orderId: order._id,
                    processName: step.stepName,
                    assignedAt: new Date()
                  }
                },
                $set: { calculatedStatus: 'Busy' }
              });
              console.log(`✅ Synced assignment for Employee: ${step.employeeId}`);
            } catch (empErr) {
              console.error(`❌ Failed to sync assignment for Employee ${step.employeeId}:`, empErr);
            }
          }
        }

        orderItem.jobBatches.push({
          jobId: savedJob._id,
          jobNumber: savedJob.jobNumber,
          batchQty: savedJob.quantity,
          status: 'Pending'
        });
      }
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order stage
router.patch('/:id/stage', checkPermission('editOrders'), async (req, res) => {
  try {
    const { stage, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStage = stage;
    if (stage === 'OnHold') order.holdReason = reason;

    await order.save();
    res.json({ message: `Order moved to ${stage}`, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Put order on hold
router.patch('/:id/hold', checkPermission('editOrders'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStage = 'OnHold';
    order.holdReason = reason || 'Admin intervention';
    await order.save();

    res.json({ message: 'Order put on hold', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resume order (back to previous stage or next logical stage)
router.patch('/:id/resume', checkPermission('editOrders'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Logic to determine resume stage (usually where it was, but let's default to Processing if unknown)
    order.orderStage = 'Processing';
    order.holdReason = '';
    await order.save();

    res.json({ message: 'Order resumed', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update item QC status
router.patch('/:id/items/:itemId/qc', checkPermission('editOrders'), async (req, res) => {
  try {
    const { qcStatus } = req.body;
    const order = await Order.findById(req.params.id);
    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.qcStatus = qcStatus;

    // Auto transition check: If all items passed QC, move order to FQC or Documentation
    const allItemsPassed = order.items.every(i => i.qcStatus === 'Passed');
    if (allItemsPassed && order.orderStage === 'Processing') {
      order.orderStage = 'FQC';
    }

    await order.save();
    res.json({ message: 'QC Status updated', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Split Batch / Partial Manufacturing API
router.post('/:id/items/:itemId/split-batch', checkPermission('editOrders'), async (req, res) => {
  try {
    const { splitQty } = req.body;
    const order = await Order.findById(req.params.id);
    const item = order.items.id(req.params.itemId);

    if (!item) return res.status(404).json({ message: 'Item not found' });

    const totalOrdered = item.quantity;
    const currentBatched = (item.jobBatches || []).reduce((sum, b) => sum + (b.batchQty || 0), 0);
    const remaining = totalOrdered - currentBatched;

    if (splitQty > remaining) {
      return res.status(400).json({ message: `Split quantity (${splitQty}) exceeds remaining quantity (${remaining})` });
    }

    // Create new Job Card for the split batch
    const jobNumber = await getNextJobNo();
    const newJobCard = new JobCard({
      jobNumber,
      orderId: order._id,
      orderItemId: item._id,
      itemId: item.item,
      quantity: splitQty,
      priority: item.priority,
      deliveryDate: item.deliveryDate,
      steps: (item.manufacturingSteps || []).map(s => ({
        stepId: s.id,
        stepName: s.stepName,
        employeeId: s.employeeId,
        status: 'pending'
      }))
    });

    const savedJob = await newJobCard.save();

    // Add to item jobBatches
    item.jobBatches.push({
      jobId: savedJob._id,
      jobNumber: savedJob.jobNumber,
      batchQty: savedJob.quantity,
      status: 'Pending'
    });

    await order.save();
    res.json({ message: 'Batch split successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
