const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const JobCard = require('../models/JobCard');
const Employee = require('../models/Employee');
const RawMaterial = require('../models/RawMaterial');
const WIPStock = require('../models/WIPStock');
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
            path: 'steps.assignedEmployees.employeeId',
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
              steps: j.steps.map(s => ({
                ...s,
                // Map first assigned employee to employeeId for frontend compatibility
                employeeId: (s.assignedEmployees && s.assignedEmployees.length > 0 && s.assignedEmployees[0].employeeId)
                  ? s.assignedEmployees[0].employeeId
                  : null
              }))
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
        })),
        rmRequirements: (item.rmRequirements || []).map(rm => ({
          ...rm,
          required: parseFloat(rm.required) || 0,
          itemCode: rm.itemCode || rm.code || ''
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
        })),
        rmRequirements: (item.rmRequirements || []).map(rm => ({
          ...rm,
          required: parseFloat(rm.required) || 0,
          itemCode: rm.itemCode || rm.code || ''
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

    // Automatic stage transition when pushing to production
    if (status === 'Processing' && order.orderStage === 'New') {
      order.orderStage = 'Processing';
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

// Plan Production / Create Job Card API
router.post('/:id/items/:itemId/plan-production', checkPermission('editOrders'), async (req, res) => {
  try {
    // FILE LOG - This will DEFINITELY show if route is hit
    const fs = require('fs');
    const logPath = require('path').join(__dirname, '..', 'ROUTE_HIT_LOG.txt');
    fs.appendFileSync(logPath, `\n\n=== PLAN PRODUCTION CALLED at ${new Date().toISOString()} ===\n`);
    fs.appendFileSync(logPath, `Order ID: ${req.params.id}\n`);
    fs.appendFileSync(logPath, `Item ID: ${req.params.itemId}\n`);
    fs.appendFileSync(logPath, `Body: ${JSON.stringify(req.body)}\n`);

    console.log('\n\n🚨🚨🚨 PLAN PRODUCTION ROUTE HIT 🚨🚨🚨\n');
    console.log('--- PLAN PRODUCTION REQUEST ---');
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    const { batchQty, extraQty, customSteps } = req.body;
    const order = await Order.findById(req.params.id);
    const item = order.items.id(req.params.itemId);

    if (!item) {
      console.error('❌ Item not found in order');
      return res.status(404).json({ message: 'Item not found' });
    }

    const totalOrdered = item.quantity;
    const currentPlanned = (item.jobBatches || []).reduce((sum, b) => sum + (b.batchQty || 0), 0);
    const remaining = totalOrdered - currentPlanned;

    console.log(`📊 Qty Check: Batch=${batchQty}, Extra=${extraQty}, Total=${totalOrdered}, Planned=${currentPlanned}, Remaining=${remaining}`);

    const qty = Number(batchQty);
    const extra = Number(extraQty) || 0;

    if (isNaN(qty) || qty <= 0) {
      console.error('❌ Invalid Batch Qty:', batchQty);
      return res.status(400).json({ message: 'Batch quantity must be greater than 0' });
    }

    if (qty > remaining) {
      console.error(`❌ Batch Qty Exceeds Remaining: ${qty} > ${remaining}`);
      return res.status(400).json({ message: `Batch quantity (${qty}) exceeds remaining quantity (${remaining})` });
    }

    // 1. Production Mode Validation
    if (item.productionMode === 'hold') {
      return res.status(400).json({ message: 'Production for this item is currently ON HOLD due to raw material shortage.' });
    }

    // Generate Job Number only at this stage
    const jobNumber = await getNextJobNo();

    // 2. Determine steps & Append Mandatory FQC
    const stepsToUse = (customSteps && customSteps.length > 0) ? [...customSteps] : [...(item.manufacturingSteps || [])];

    // Fetch master item to get actual FQC config
    const masterItem = await Item.findById(item.item);
    if (masterItem && masterItem.finalQualityCheck?.length > 0) {
      // Auto-add FQC Step if not already present
      const hasFQC = stepsToUse.some(s => s.stepName?.toLowerCase().includes('qc') || s.stepType === 'testing');
      if (!hasFQC || true) { // Requirement says "Automatically add +1 FQC step"
        stepsToUse.push({
          id: stepsToUse.length + 1,
          stepName: 'Final Quality Check',
          description: 'System mandatory final inspection',
          stepType: 'testing',
          timeToComplete: '1h',
          isMandatoryFQC: true // Flag to identify it
        });
      }
    }

    // Validate that we have at least one step
    if (!stepsToUse || stepsToUse.length === 0) {
      console.error('❌ No manufacturing steps defined for item');
      return res.status(400).json({ message: 'No manufacturing steps defined. Please add steps to the order item first.' });
    }

    const newJobCard = new JobCard({
      jobNumber,
      orderId: order._id,
      orderItemId: item._id,
      itemId: item.item,
      quantity: qty + extra, // Total quantity for the job
      extraQty: extra, // Track explicitly how much was extra
      priority: item.priority,
      deliveryDate: item.deliveryDate,
      status: 'Created',
      stage: 'Assigned',
      // Store RM snapshot for this batch (base + extra)
      rmRequirements: (() => {
        if (item.rmRequirements && item.rmRequirements.length > 0) {
          return item.rmRequirements.map(rm => ({
            ...rm,
            itemCode: rm.itemCode || rm.code || '',
            required: (rm.required / item.quantity) * (qty + extra)
          }));
        } else if (masterItem && masterItem.rawMaterials && masterItem.rawMaterials.length > 0) {
          console.log('[PlanProduction] Using Master BOM Fallback for RM requirements');
          return masterItem.rawMaterials.map(rm => ({
            itemCode: rm.itemCode,
            name: rm.materialName,
            uom: rm.unit,
            required: (rm.consumptionPerUnit || 0) * (qty + extra)
          }));
        }
        return [];
      })(),
      requiredSamples: masterItem?.finalQualityCheckSampleSize || 1,
      fqcParameters: (masterItem?.finalQualityCheck || []).map(p => ({
        parameterName: p.parameter,
        notation: p.notation,
        tolerance: p.tolerance || '',
        positiveTolerance: p.positiveTolerance || '',
        negativeTolerance: p.negativeTolerance || '',
        actualValue: p.actualValue || '',
        valueType: p.valueType,
        standardValue: p.standardValue || '',
        samples: Array.from({ length: masterItem.finalQualityCheckSampleSize || 1 }, (_, i) => ({
          sampleNumber: i + 1,
          reading: ''
        }))
      })),
      steps: stepsToUse.map(s => ({
        stepId: s.id || s.stepId,
        stepName: s.stepName,
        description: s.description,
        stepType: s.stepType === 'testing' ? 'testing' : (s.stepType || 'execution'),
        // Support for new assignment logic
        assignedEmployees: (s.assignedEmployees || []).map(ae => ({
          employeeId: ae.employeeId,
          assignedAt: ae.assignedAt || new Date()
        })).concat((s.employeeId && s.employeeId !== '' && (!s.assignedEmployees || s.assignedEmployees.length === 0)) ? [{ employeeId: s.employeeId, assignedAt: new Date() }] : []),
        isOpenJob: !!s.isOpenJob,
        isOutward: !!s.isOutward,
        outwardDetails: s.outwardDetails || {},
        quantities: {
          received: 0,
          processed: 0,
          rejected: 0
        },
        status: 'pending',
        timeToComplete: s.timeToComplete,
        targetStartDate: s.targetStartDate ? new Date(s.targetStartDate) : null,
        targetDeadline: s.targetDeadline ? new Date(s.targetDeadline) : null,
        subSteps: (s.subSteps || []).map(ss => ({
          id: ss.id,
          name: ss.name,
          description: ss.description,
          status: 'pending'
        }))
      }))
    });

    const savedJob = await newJobCard.save();

    // Add to item jobBatches and update plannedQty
    item.jobBatches.push({
      jobId: savedJob._id,
      jobNumber: savedJob.jobNumber,
      batchQty: savedJob.quantity,
      status: 'Pending'
    });

    item.plannedQty = (item.plannedQty || 0) + batchQty;

    // Sync assignments to employees (Handling multiple employees per step)
    for (const step of newJobCard.steps) {
      if (step.assignedEmployees && step.assignedEmployees.length > 0) {
        for (const assignment of step.assignedEmployees) {
          await Employee.findByIdAndUpdate(assignment.employeeId, {
            $push: {
              currentAssignments: {
                orderId: order._id,
                jobCardId: savedJob._id, // Note: Added to Employee model if missing, or ignored if not in schema
                processName: step.stepName,
                assignedAt: new Date()
              }
            },
            $set: { calculatedStatus: 'Busy' }
          });
        }

      }
    }

    // --- AUTOMATIC RM DEDUCTION & WIP CREATION ---
    try {
      // 1. Deduct Raw Material
      const rmReqs = savedJob.rmRequirements || [];
      const rmUsageLog = [];
      const consumptionLog = []; // Track consumption for job card

      // FILE LOG for RM Deduction
      fs.appendFileSync(logPath, `\n--- RM DEDUCTION SECTION ---\n`);
      fs.appendFileSync(logPath, `Total RM Requirements: ${rmReqs.length}\n`);
      fs.appendFileSync(logPath, `RM Data: ${JSON.stringify(rmReqs, null, 2)}\n`);

      console.log(`\n========== RM DEDUCTION START for Job ${savedJob.jobNumber} ==========`);
      console.log(`Total RM Requirements: ${rmReqs.length}`);

      for (const rm of rmReqs) {
        console.log(`\n--- Processing RM: ${rm.name} ---`);
        console.log(`  Code: ${rm.itemCode || rm.code || 'N/A'}`);
        console.log(`  Required Qty: ${rm.required} ${rm.uom || ''}`);

        if (rm.required > 0) {
          // Robust Deduction Logic: Try exact Code match first, then Name
          let deduced = await RawMaterial.findOneAndUpdate(
            { code: rm.itemCode || rm.code },
            {
              $inc: { qty: -rm.required },
              $push: {
                consumptionHistory: {
                  jobNumber: savedJob.jobNumber,
                  poNumber: order.poNumber || 'N/A',
                  itemName: masterItem?.name || item.itemName || 'Unknown',
                  quantityConsumed: rm.required,
                  consumedAt: new Date(),
                  remarks: `Consumed for job ${savedJob.jobNumber}`
                }
              }
            },
            { new: true }
          );

          if (!deduced && rm.name) {
            // Fallback: Try by Name if Code failed
            console.log(`  ⚠️  Code match failed, trying by Name: "${rm.name}"`);
            deduced = await RawMaterial.findOneAndUpdate(
              { name: rm.name },
              {
                $inc: { qty: -rm.required },
                $push: {
                  consumptionHistory: {
                    jobNumber: savedJob.jobNumber,
                    poNumber: order.poNumber || 'N/A',
                    itemName: masterItem?.name || item.itemName || 'Unknown',
                    quantityConsumed: rm.required,
                    consumedAt: new Date(),
                    remarks: `Consumed for job ${savedJob.jobNumber}`
                  }
                }
              },
              { new: true }
            );
          }

          if (deduced) {
            rmUsageLog.push(`${rm.required} ${rm.uom || ''} (${deduced.code})`);

            // Track consumption for job card
            consumptionLog.push({
              materialCode: deduced.code,
              materialName: deduced.name,
              quantityConsumed: rm.required,
              uom: deduced.uom
            });

            console.log(`  ✅ SUCCESS: Deducted ${rm.required} ${deduced.uom} of '${deduced.name}' (Code: ${deduced.code})`);
            console.log(`  📊 New Stock Level: ${deduced.qty} ${deduced.uom}`);
          } else {
            console.error(`  ❌ FAILED: Material not found in RawMaterial collection`);
            console.error(`     Searched by Code: "${rm.itemCode || rm.code}" and Name: "${rm.name}"`);
            rmUsageLog.push(`FAILED: ${rm.name}`);
          }
        } else {
          console.log(`  ⏭️  Skipped (required qty is 0)`);
        }
      }

      // Save consumption log to job card
      if (consumptionLog.length > 0) {
        savedJob.rmConsumptionLog = consumptionLog;
        await savedJob.save();
        console.log(`\n📝 Saved ${consumptionLog.length} consumption records to Job Card`);
        fs.appendFileSync(logPath, `\nSaved ${consumptionLog.length} consumption records to job\n`);
      }

      console.log(`\n========== RM DEDUCTION END ==========\n`);

      // 2. Create WIP Entry (Initial Stock)
      await WIPStock.create({
        jobNo: savedJob.jobNumber,
        partNo: masterItem?.code || 'Unknown',
        partName: masterItem?.name || 'Unknown Part',
        qty: savedJob.quantity,
        initialQty: savedJob.quantity, // Set initial quantity same as starting batch size
        uom: masterItem?.uom || 'Unit',
        currentStage: savedJob.steps[0]?.stepName || 'Planning',
        status: 'In Progress',
        batchCode: savedJob.jobNumber,
        rmConsumed: rmUsageLog.join(', ') || 'None' // Save RM details
      });
      console.log(`[JobCreation] Created WIP Entry for Job ${savedJob.jobNumber}`);

    } catch (metricErr) {
      console.error('Error processing metrics (RM/WIP) during job creation:', metricErr);
    }

    // Update order stage if it was New/Confirmed
    if (order.orderStage === 'New' || order.orderStage === 'Confirmed') {
      order.orderStage = 'Processing';
    }

    await order.save();
    res.json({
      message: 'Production planned and Job Card generated successfully',
      order,
      jobCard: savedJob
    });
  } catch (err) {
    console.error('Plan production error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
