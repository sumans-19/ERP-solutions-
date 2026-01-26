const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Apply authentication to all routes
router.use(authenticateToken);

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
        priority: item.priority || 'Normal'
      };
    });

    const newOrder = new Order({
      partyName: partyName.trim(),
      poNumber: poNumber?.trim() || '',
      poDate: new Date(poDate),
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      items: processedItems,
      notes: notes?.trim() || '',
      status: status || 'New'
    });

    await newOrder.save();
    await newOrder.populate('items.item', 'name code unit salePrice');

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
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
        priority: item.priority || 'Normal'
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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.item', 'name code unit salePrice');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get orders assigned to an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const orders = await Order.find({ assignedTo: employeeId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching employee orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
});

// Get order statistics for an employee
router.get('/employee/:employeeId/stats', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const stats = await Order.aggregate([
      { $match: { assignedTo: employeeId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] }
          },
          notStarted: {
            $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0
    };
    
    res.json({ success: true, stats: result });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
});

// Update order progress
router.put('/:orderId/progress', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completionPercent, status } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (completionPercent !== undefined) {
      order.completionPercent = completionPercent;
    }
    
    if (status) {
      order.status = status;
    }
    
    await order.save();
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order progress:', error);
    res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
  }
});

module.exports = router;
