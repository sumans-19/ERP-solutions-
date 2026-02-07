import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Package, ShoppingCart, User, ChevronDown, Settings, X, Layers, List, Search, Filter, ArrowUpRight, Ban, CheckCircle2, CheckCircle, Activity, PlayCircle, FileText, AlertTriangle } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { getAllItems, getAllOrders, createOrder, updateOrder, deleteOrder, updateOrderStatus, getAllParties, getEmployees, getRawMaterials } from '../services/api';
import axios from 'axios';
import OrderTreeView from './Orders/OrderTreeView';
import OrderStageGate from './Orders/OrderStageGate';
import { canCreate, canEdit, canDelete } from '../utils/permissions';

const getTodayString = () => new Date().toISOString().slice(0, 10);

const createNewItemRow = () => ({
  id: Date.now(),
  item: null,
  itemCode: '',
  itemName: '',
  quantity: 1,
  unit: 'NONE',
  rate: 0,
  amount: 0,
  deliveryDate: '',
  priority: 'Normal',
  manufacturingSteps: []
});

export default function Orders() {
  const { showNotification } = useNotification();
  const [activeView, setActiveView] = useState('stages');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rawMaterialsMap, setRawMaterialsMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stageUpdating, setStageUpdating] = useState(null);
  const [productionConfirmOrder, setProductionConfirmOrder] = useState(null);

  // Form states
  const [partyName, setPartyName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(getTodayString());
  const [estDate, setEstDate] = useState('');
  const [itemRows, setItemRows] = useState([createNewItemRow()]);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      const [itemsRes, ordersRes, partiesRes, employeesRes, rmRes] = await Promise.all([
        getAllItems(),
        getAllOrders(),
        getAllParties(),
        getEmployees(),
        getRawMaterials()
      ]);
      setItems(Array.isArray(itemsRes) ? itemsRes : itemsRes.data || []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
      setParties(Array.isArray(partiesRes) ? partiesRes : partiesRes.data || []);
      setEmployees(Array.isArray(employeesRes) ? employeesRes : employeesRes.data || []);
      setRawMaterialsMap(Array.isArray(rmRes) ? rmRes : rmRes.data || []);
      return { items: Array.isArray(itemsRes) ? itemsRes : itemsRes.data || [] };
    } catch (err) {
      console.error('Error loading data:', err);
      showNotification('Failed to load data', 'error');
      return { items: [] };
    }
  };

  // Fetch items, orders and parties
  useEffect(() => {
    fetchData();
  }, []);

  const handleItemRowChange = (index, field, value) => {
    const newRows = [...itemRows];
    const row = newRows[index];
    row[field] = value;

    if (field === 'item' || field === 'quantity' || field === 'itemCode') {
      let selectedItem = null;
      if (field === 'item') {
        selectedItem = items.find(i => i._id === value);
      } else if (field === 'itemCode') {
        selectedItem = items.find(i => i.code?.toLowerCase() === value.toLowerCase());
      } else {
        selectedItem = items.find(i => i._id === row.item);
      }

      if (!selectedItem && field === 'item' && typeof value === 'string') {
        selectedItem = items.find(i => i.name?.toLowerCase() === value.toLowerCase());
      }

      if (selectedItem) {
        if (field === 'item' || field === 'itemCode') {
          row.item = selectedItem._id;
          row.itemCode = selectedItem.code || '';
          row.itemName = selectedItem.name;
          row.unit = selectedItem.unit || 'NONE';
          row.rate = parseFloat(selectedItem.salePrice) || 0;
          row.manufacturingSteps = selectedItem.processes || [];
          row.currentStock = selectedItem.currentStock || 0;
        }

        // Calculate Raw Material Requirements
        const qty = field === 'quantity' ? parseFloat(value) : parseFloat(row.quantity);
        row.rmRequirements = (selectedItem.rawMaterials || []).map(rm => {
          // Find live stock from RawMaterials collection
          const liveRM = rawMaterialsMap.find(r =>
            (r.code && r.code?.trim() === rm.itemCode?.trim()) ||
            (r.name && r.name?.trim().toLowerCase() === rm.materialName?.trim().toLowerCase()) ||
            (r.name && r.name?.trim().toLowerCase() === rm.name?.trim().toLowerCase())
          );

          const consumption = parseFloat(rm.consumptionPerUnit) || parseFloat(rm.quantity) || 0;
          const required = consumption * (qty || 0);

          // Use live stock if found, otherwise fallback (safer 0 check)
          const available = liveRM ? (liveRM.qty || 0) : 0;

          return {
            name: rm.materialName || rm.name,
            required,
            available,
            shortage: Math.max(0, required - available),
            unit: liveRM ? liveRM.uom : (rm.unit || 'Units')
          };
        });
      } else if (field === 'item') {
        row.item = null;
        row.itemCode = ''; // Clear code if name typed manually and not found
        row.itemName = value;
        row.manufacturingSteps = [];
        row.currentStock = 0;
        row.rmRequirements = [];
      } else if (field === 'itemCode') {
        // If code typed but not found, just update the field but clear linked data
        row.item = null;
        row.itemName = '';
        row.manufacturingSteps = [];
        row.currentStock = 0;
        row.rmRequirements = [];
      }
    }

    if (field === 'quantity' || field === 'rate' || field === 'item') {
      row.amount = (parseFloat(row.quantity) || 0) * (parseFloat(row.rate) || 0);
    }

    setItemRows(newRows);
  };

  const applyOverallDateToItems = () => {
    if (!estDate) return;
    const newRows = itemRows.map(row => ({ ...row, deliveryDate: estDate }));
    setItemRows(newRows);
  };

  const addNewRow = () => setItemRows([...itemRows, createNewItemRow()]);
  const removeRow = (index) => itemRows.length > 1 && setItemRows(itemRows.filter((_, i) => i !== index));

  const totalAmount = useMemo(() => {
    return itemRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0).toFixed(2);
  }, [itemRows]);

  const totalQty = useMemo(() => {
    return itemRows.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
  }, [itemRows]);

  // Aggregate raw materials across all items - combine same RM from different items
  const aggregatedRawMaterials = useMemo(() => {
    const rmMap = {};

    itemRows.forEach(row => {
      if (row.rmRequirements && row.rmRequirements.length > 0) {
        row.rmRequirements.forEach(rm => {
          const key = rm.name?.toLowerCase().trim();
          if (!key) return;

          if (rmMap[key]) {
            // Same material - add the required amounts
            rmMap[key].totalRequired += rm.required || 0;
          } else {
            // New material - initialize entry
            rmMap[key] = {
              name: rm.name,
              totalRequired: rm.required || 0,
              available: rm.available || 0,
              unit: rm.unit || 'Units'
            };
          }
        });
      }
    });

    // Calculate shortage for each aggregated material
    return Object.values(rmMap).map(rm => ({
      ...rm,
      shortage: Math.max(0, rm.totalRequired - rm.available)
    }));
  }, [itemRows]);

  const handleSaveOrder = async () => {
    if (!partyName.trim()) {
      showNotification('Customer name is required', 'warning');
      return;
    }
    if (itemRows.length === 0) {
      showNotification('Add at least one item', 'warning');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        partyName: partyName.trim(),
        poNumber: poNumber.trim(),
        poDate,
        estimatedDeliveryDate: estDate,
        items: itemRows.map(r => ({
          item: r.item,
          itemCode: r.itemCode,
          itemName: r.itemName,
          quantity: parseFloat(r.quantity) || 1,
          unit: r.unit,
          rate: parseFloat(r.rate) || 0,
          amount: parseFloat(r.amount) || 0,
          deliveryDate: r.deliveryDate,
          priority: r.priority || 'Normal',
          productionMode: r.productionMode || 'normal',
          rmRequirements: r.rmRequirements || [],
          manufacturingSteps: (r.manufacturingSteps || []).map(s => ({
            ...s,
            employeeId: s.employeeId || null
          }))
        })),
        notes: notes.trim(),
        status: editingOrderId ? undefined : 'New'
      };

      if (editingOrderId) {
        await updateOrder(editingOrderId, orderData);
        showNotification('Order updated successfully!');
      } else {
        await createOrder(orderData);
        showNotification('Order created successfully!');
      }

      // Reload orders
      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);

      // Reset form
      handleCancel();

    } catch (err) {
      console.error('Error saving order:', err);
      showNotification(err?.response?.data?.message || err.message || 'Failed to save order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (orderId, newStage, reason = '') => {
    setStageUpdating(orderId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.10:5001';
      await axios.patch(`${apiUrl}/api/orders/${orderId}/stage`, { stage: newStage, reason });
      showNotification(`Order moved to ${newStage}`);

      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
    } catch (err) {
      showNotification('Failed to update stage', 'error');
    } finally {
      setStageUpdating(null);
    }
  };

  const handleHoldResume = async (order, action) => {
    setStageUpdating(order._id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.10:5001';
      if (action === 'hold') {
        const reason = window.prompt('Enter reason for Hold:');
        if (reason === null) return;
        await axios.patch(`${apiUrl}/api/orders/${order._id}/hold`, { reason });
        showNotification('Order put ON HOLD', 'info');
      } else {
        await axios.patch(`${apiUrl}/api/orders/${order._id}/resume`);
        showNotification('Order Resumed');
      }

      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
    } catch (err) {
      showNotification(`Failed to ${action} order`, 'error');
    } finally {
      setStageUpdating(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter || o.orderStage === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleEditOrder = async (order) => {
    // Refresh data before editing to get latest stock levels
    const { items: freshItems } = await fetchData();
    const currentItems = freshItems || items;

    setEditingOrderId(order._id);
    setPartyName(order.partyName);
    setPoNumber(order.poNumber);
    setPoDate(new Date(order.poDate).toISOString().slice(0, 10));
    setEstDate(order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10) : '');
    setNotes(order.notes);
    setItemRows(order.items.map((item, idx) => ({
      id: idx,
      item: item.item?._id || item.item || null,
      itemCode: item.itemCode || item.item?.code || '',
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount: item.amount,
      deliveryDate: item.deliveryDate ? new Date(item.deliveryDate).toISOString().slice(0, 10) : '',
      priority: item.priority,
      manufacturingSteps: item.manufacturingSteps || []
    })));
    setActiveView('create');
  };

  const handleCancel = () => {
    setActiveView('list');
    setEditingOrderId(null);
    setPartyName('');
    setPoNumber('');
    setPoDate(getTodayString());
    setEstDate('');
    setItemRows([createNewItemRow()]);
    setNotes('');
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this order?')) {
      try {
        setLoading(true);
        await deleteOrder(id);
        showNotification('Order deleted successfully');

        // Reload orders
        const ordersRes = await getAllOrders();
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);

      } catch (err) {
        console.error('Delete error:', err);
        showNotification('Failed to delete order: ' + (err?.response?.data?.message || err.message), 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Order Management</h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wide">{editingOrderId ? 'Edit order' : 'Complete production workflow and tracking'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-md p-1 flex gap-1 shadow-sm mr-4">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold transition-all uppercase tracking-wide ${activeView === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setActiveView('tree')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold transition-all uppercase tracking-wide ${activeView === 'tree' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Layers size={14} /> Tree
            </button>
            <button
              onClick={() => setActiveView('stages')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold transition-all uppercase tracking-wide ${activeView === 'stages' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Activity size={14} /> Stage Track
            </button>
          </div>

          {activeView !== 'create' && canCreate('orders') && (
            <button
              onClick={() => {
                handleCancel();
                // Instant switch - data is already loaded on mount
                setActiveView('create');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm border border-blue-600 font-bold text-xs uppercase tracking-wide"
            >
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </div>

      {/* Messages */}


      {/* Create/Edit Form */}
      {activeView === 'create' && (
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-tight">{editingOrderId ? 'Edit Order' : 'Create New Order'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Customer Name *</label>
              <input
                type="text"
                list="parties-list"
                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-slate-50 focus:bg-white"
                value={partyName}
                onChange={e => setPartyName(e.target.value)}
                placeholder="Select customer..."
              />
              <datalist id="parties-list">
                {parties.map(p => <option key={p._id} value={p.name} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">PO Number</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-slate-50 focus:bg-white"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="PO-2024-..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">PO Date</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-slate-50 focus:bg-white"
                value={poDate}
                onChange={e => setPoDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Delivery Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-slate-50 focus:bg-white"
                  value={estDate}
                  onChange={e => setEstDate(e.target.value)}
                />
                {estDate && (
                  <button
                    onClick={applyOverallDateToItems}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 font-bold text-xs uppercase tracking-wide border border-slate-200"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden mb-6 overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Item No</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-64">Item Name</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Qty</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mfg Steps</th>
                  <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Rate</th>
                  <th className="p-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="p-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemRows.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-50 group transition-colors">
                      <td className="p-3 text-slate-400 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <div className="relative">
                          <input
                            type="text"
                            list={`items-code-list-${index}`}
                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={row.itemCode || ''}
                            onChange={e => handleItemRowChange(index, 'itemCode', e.target.value)}
                            placeholder="Item No"
                          />
                          <datalist id={`items-code-list-${index}`}>
                            {items.map(i => (
                              <option key={i._id} value={i.code || ''}>
                                {i.name}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          list="items-list"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={row.itemName || ''}
                          onChange={e => handleItemRowChange(index, 'item', e.target.value)}
                          placeholder="Find item..."
                        />
                        <datalist id="items-list">
                          {items.map(i => <option key={i._id} value={i.name} />)}
                        </datalist>
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-600 focus:border-blue-500 outline-none"
                          value={row.deliveryDate}
                          onChange={e => handleItemRowChange(index, 'deliveryDate', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-center font-medium focus:border-blue-500 outline-none"
                          value={row.quantity}
                          onChange={e => handleItemRowChange(index, 'quantity', e.target.value)}
                          min="1"
                        />
                      </td>
                      <td className="p-3 text-xs text-slate-500 font-bold uppercase">{row.unit}</td>
                      <td className="p-3">
                        <select
                          className={`w-full border rounded px-2 py-1.5 text-xs font-bold uppercase outline-none ${row.priority === 'High' ? 'bg-red-50 border-red-200 text-red-600' :
                            row.priority === 'Today' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                              row.priority === 'Low' ? 'bg-slate-50 border-slate-200 text-slate-500' :
                                'bg-white border-slate-300 text-slate-600'
                            }`}
                          value={row.priority}
                          onChange={e => handleItemRowChange(index, 'priority', e.target.value)}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Today">Today</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedRowIndex(index);
                            setShowStepModal(true);
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide border ${row.manufacturingSteps.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}
                        >
                          {row.manufacturingSteps.length > 0 ? `${row.manufacturingSteps.length} Steps` : 'Add Steps'}
                        </button>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right font-mono focus:border-blue-500 outline-none"
                          value={row.rate}
                          onChange={e => handleItemRowChange(index, 'rate', e.target.value)}
                          min="0"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 font-mono">₹{parseFloat(row.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => removeRow(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {row.item && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="11" className="px-6 py-4 border-t border-slate-100">
                          <div className="space-y-3">
                            {/* Finished Good Stock */}
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-slate-500 uppercase font-black tracking-widest">FG Stock:</span>
                              <span className="text-slate-900 font-bold">{row.currentStock || 0} {row.unit}</span>
                              {row.currentStock < row.quantity && (
                                <span className="text-blue-600 font-black flex items-center gap-1">⚡ FG SHORTFALL</span>
                              )}
                            </div>

                            {/* Raw Materials Breakdown */}
                            {row.rmRequirements?.length > 0 && (
                              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Raw Material Analysis</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {row.rmRequirements.map((rm, rmIdx) => (
                                    <div key={rmIdx} className={`p-3 rounded border ${rm.shortage > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800 text-xs">{rm.name}</span>
                                        {rm.shortage > 0 ? (
                                          <span className="text-[10px] font-black text-red-600 uppercase tracking-tight">🔴 Shortage</span>
                                        ) : (
                                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">✓ Available</span>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                        <div>Required: <span className="text-slate-900">{rm.required.toFixed(2)} {rm.unit}</span></div>
                                        <div>In Stock: <span className="text-slate-900">{rm.available.toFixed(2)} {rm.unit}</span></div>
                                      </div>
                                      {rm.shortage > 0 && (
                                        <div className="mt-2 pt-2 border-t border-red-100 text-[10px] font-black text-red-700">
                                          🔴 INSUFFICIENT RAW MATERIAL: SHORT BY {(rm.shortage).toFixed(2)} {rm.unit}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Partial Production Options */}
                                {row.rmRequirements.some(rm => rm.shortage > 0) && (
                                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-md flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="text-xs">
                                      <p className="text-indigo-900 font-bold mb-1 uppercase tracking-tight">Shortage detected. How would you like to proceed?</p>
                                      <p className="text-indigo-600 font-medium">Max producible based on current stock: <span className="font-bold text-indigo-900">
                                        {Math.floor(Math.min(...row.rmRequirements.map(rm => rm.required > 0 ? (rm.available / (rm.required / row.quantity)) : 999999)))} units
                                      </span></p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleItemRowChange(index, 'productionMode', 'partial')}
                                        className={`px-4 py-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all border ${row.productionMode === 'partial' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                      >
                                        Produce with Available Material
                                      </button>
                                      <button
                                        onClick={() => handleItemRowChange(index, 'productionMode', 'hold')}
                                        className={`px-4 py-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all border ${row.productionMode === 'hold' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                                      >
                                        Hold Until Material Available
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <button
              onClick={addNewRow}
              className="w-full py-2.5 bg-slate-50 text-blue-600 font-bold hover:bg-slate-100 transition border-t border-slate-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Item Line
            </button>
          </div>

          {/* Aggregated Raw Materials Summary - Shows combined RM from all items */}
          {aggregatedRawMaterials.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-md border border-slate-200 p-5 mb-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={16} className="text-slate-500" />
                Total Raw Material Requirements (All Items Combined)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aggregatedRawMaterials.map((rm, idx) => (
                  <div key={idx} className={`bg-white p-4 rounded-lg border-2 transition-all ${rm.shortage > 0 ? 'border-red-300 shadow-red-100 shadow-md' : 'border-emerald-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-slate-800 text-sm">{rm.name}</span>
                      {rm.shortage > 0 ? (
                        <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded uppercase">Shortage</span>
                      ) : (
                        <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded uppercase">Available</span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold uppercase">Total Required:</span>
                        <span className="font-bold text-slate-800">{rm.totalRequired.toFixed(2)} {rm.unit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold uppercase">In Stock:</span>
                        <span className="font-bold text-slate-800">{rm.available.toFixed(2)} {rm.unit}</span>
                      </div>
                      {rm.shortage > 0 && (
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-red-100">
                          <span className="text-red-600 font-black uppercase">Short By:</span>
                          <span className="font-black text-red-600 text-sm">{rm.shortage.toFixed(2)} {rm.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {aggregatedRawMaterials.some(rm => rm.shortage > 0) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Warning: Some raw materials have insufficient stock. Review individual items above for production options.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Notes / Special Instructions</label>
              <textarea
                className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                rows="4"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Terms, shipping notes, etc..."
              />
            </div>
            <div className="bg-slate-800 rounded-md p-6 text-white shadow-sm h-fit border border-slate-700">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <span>Item Count</span>
                  <span className="text-white text-lg">{totalQty}</span>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated Total</div>
                  <div className="text-2xl font-bold text-white font-mono">₹{parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-md font-bold text-slate-600 hover:bg-slate-100 transition uppercase text-xs tracking-wide border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 shadow-md transition disabled:bg-slate-300 disabled:shadow-none uppercase text-xs tracking-wide border border-transparent"
            >
              {loading ? 'Processing...' : editingOrderId ? 'Update Order' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}

      {/* Tree View Section */}
      {activeView === 'tree' && <OrderTreeView />}

      {/* Stage View Section */}
      {activeView === 'stages' && <OrderStageGate />}

      {/* List View */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-md border border-slate-200 shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by Party or PO Number..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-700 outline-none uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Stages</option>
                <option value="New">New</option>
                <option value="Mapped">Mapped</option>
                <option value="Assigned">Assigned</option>
                <option value="Processing">Processing</option>
                <option value="MFGCompleted">Production Done</option>
                <option value="FQC">QC Stage</option>
                <option value="Dispatch">Dispatch</option>
                <option value="OnHold">On Hold</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-dashed border-slate-300">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">No orders found</h3>
              <p className="text-slate-500 mb-8 text-sm font-medium">Try adjusting your filters or create a new order to get started.</p>
              <button
                onClick={() => setActiveView('create')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest"
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map(order => (
                <div key={order._id} className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group relative hover:z-20">
                  {/* Accent Glow Wrapper to allow clipping without overflow-hidden on parent */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                    <div className={`absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${order.orderStage === 'OnHold' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                  </div>

                  <div className="p-0 relative z-10">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        {/* Identity & Status */}
                        <div className="flex-1 min-w-[300px]">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-xl tracking-tighter">{order.partyName}</h3>
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.orderStage === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.orderStage === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                order.orderStage === 'FQC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  order.orderStage === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    order.orderStage === 'OnHold' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                              {order.orderStage || 'New'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                              <FileText size={14} className="text-slate-400" />
                              <span className="font-mono text-xs font-bold text-slate-600">{order.poNumber || 'PO: NOT SET'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                              <Calendar size={14} className="text-slate-400" />
                              {formatDate(order.poDate)}
                            </div>
                            <div className="flex items-center gap-2 text-blue-600 font-black text-[11px] uppercase tracking-wider">
                              <Package size={14} className="text-blue-400" />
                              {order.items?.length || 0} POSITIONS
                            </div>
                          </div>
                        </div>

                        {/* Value & Summary */}
                        <div className="flex items-center gap-12 justify-between lg:justify-end min-w-[250px]">
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ">Order value</div>
                            <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                              ₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Quantity</div>
                            <div className="text-2xl font-black text-blue-600 font-mono tracking-tighter">
                              {order.totalQty || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.orderStage === 'OnHold' && (
                        <div className="mt-6 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                            <Ban size={16} />
                          </div>
                          <div className="text-xs">
                            <span className="font-black text-rose-800 uppercase tracking-tight block">Order Put On Hold</span>
                            <span className="text-rose-600 font-bold">{order.holdReason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Bar - Integrated Design to prevent stacking */}
                    <div className="px-6 py-5 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 flex flex-wrap items-center justify-between gap-6 group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm">U{i}</div>
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Modified {new Date(order.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {canEdit('orders') && (
                          <button onClick={() => handleEditOrder(order)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:shadow-lg transition-all uppercase tracking-widest">
                            <Edit2 size={14} />
                            <span>Quick Edit</span>
                          </button>
                        )}

                        {(order.status === 'New' || order.status === 'Confirmed') && canEdit('orders') && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Move this order to Production? It will then be available in the Production Planning stage.')) {
                                try {
                                  setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'Processing', orderStage: 'Processing' } : o));
                                  await updateOrderStatus(order._id, 'Processing');
                                  showNotification('Order moved to Production Planning!');
                                  getAllOrders().then(res => setOrders(Array.isArray(res) ? res : res.data || []));
                                } catch (err) {
                                  showNotification('Failed to update status', 'error');
                                  fetchData();
                                }
                              }
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white border border-transparent rounded-lg text-[11px] font-black hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all uppercase tracking-widest"
                          >
                            <PlayCircle size={14} />
                            <span>Start Production</span>
                          </button>
                        )}

                        <div className="relative group/stage">
                          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all uppercase tracking-widest">
                            <ArrowUpRight size={14} />
                            <span>Stage</span>
                          </button>
                          <div className="invisible group-hover/stage:visible absolute top-full right-0 mt-2 bg-white shadow-2xl border border-slate-200 rounded-xl p-2 z-[100] flex flex-col min-w-[200px] animate-in slide-in-from-top-2 fade-in duration-300 ring-4 ring-slate-100/50">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2 border-b border-slate-100 mb-1">Workflow Pipeline</div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                              {['New', 'Mapped', 'Assigned', 'Processing', 'MFGCompleted', 'FQC', 'Documentation', 'Packing', 'Dispatch', 'Completed'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateStage(order._id, s)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all ${order.orderStage === s ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-600'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {canDelete('orders') && (
                          <button onClick={() => handleDeleteOrder(order._id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Step Customization Modal */}
      {
        showStepModal && selectedRowIndex !== null && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-none mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Production Workflow
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-3.5">
                    Order Item: {itemRows[selectedRowIndex]?.itemName}
                  </p>
                </div>
                <button
                  onClick={() => setShowStepModal(false)}
                  className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-md flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {itemRows[selectedRowIndex].manufacturingSteps.map((step, sIdx) => (
                  <div key={sIdx} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-600 rounded-r-md"></div>

                    {/* Main Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                      <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Step Name */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Step Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            value={step.stepName}
                            onChange={e => {
                              const newRows = [...itemRows];
                              newRows[selectedRowIndex].manufacturingSteps[sIdx].stepName = e.target.value;
                              setItemRows(newRows);
                            }}
                            placeholder="e.g. Quality Control"
                          />
                        </div>

                        {/* Process Type */}
                        <div className="space-y-1.5 relative">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Process Type</label>
                          <div className="relative">
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all outline-none cursor-pointer"
                              value={step.stepType}
                              onChange={e => {
                                const newRows = [...itemRows];
                                newRows[selectedRowIndex].manufacturingSteps[sIdx].stepType = e.target.value;
                                newRows[selectedRowIndex].manufacturingSteps[sIdx].employeeId = ""; // Reset assignment on type change
                                setItemRows(newRows);
                              }}
                            >
                              <option>MECHANICAL</option>
                              <option>ELECTRICAL</option>
                              <option>ASSEMBLY</option>
                              <option>QUALITY</option>
                              <option>PACKING</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-[40%] text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Assignment */}
                        <div className="space-y-1.5 relative">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Specialist</label>
                          <div className="relative">
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 pl-9 text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none outline-none cursor-pointer"
                              value={step.employeeId || ''}
                              onChange={e => {
                                const newRows = [...itemRows];
                                newRows[selectedRowIndex].manufacturingSteps[sIdx].employeeId = e.target.value;
                                setItemRows(newRows);
                              }}
                            >
                              <option value="">UNCATEGORIZED</option>
                              {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.fullName || emp.name}</option>
                              ))}
                            </select>
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-[40%] text-slate-400 pointer-events-none" />
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-[40%] text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        <button
                          onClick={() => {
                            const newRows = [...itemRows];
                            newRows[selectedRowIndex].manufacturingSteps.splice(sIdx, 1);
                            setItemRows(newRows);
                          }}
                          className="w-9 h-9 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                          title="Remove Step"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Timeline section */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-5 border border-dashed border-slate-200">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                          Target Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                          value={step.targetStartDate ? new Date(step.targetStartDate).toISOString().slice(0, 10) : ''}
                          onChange={e => {
                            const newRows = [...itemRows];
                            newRows[selectedRowIndex].manufacturingSteps[sIdx].targetStartDate = e.target.value;
                            setItemRows(newRows);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                          Due Date / Deadline
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                          value={step.targetDeadline ? new Date(step.targetDeadline).toISOString().slice(0, 10) : ''}
                          onChange={e => {
                            const newRows = [...itemRows];
                            newRows[selectedRowIndex].manufacturingSteps[sIdx].targetDeadline = e.target.value;
                            setItemRows(newRows);
                          }}
                        />
                      </div>
                    </div>

                    {/* Notes Row */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Phase Instructions</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                        value={step.description || ''}
                        rows="2"
                        onChange={e => {
                          const newRows = [...itemRows];
                          newRows[selectedRowIndex].manufacturingSteps[sIdx].description = e.target.value;
                          setItemRows(newRows);
                        }}
                        placeholder="Add technical notes or constraints..."
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newRows = [...itemRows];
                    newRows[selectedRowIndex].manufacturingSteps.push({
                      id: Date.now(),
                      stepName: '',
                      description: '',
                      stepType: 'MECHANICAL',
                      employeeId: null,
                      status: 'pending'
                    });
                    setItemRows(newRows);
                  }}
                  className="w-full py-5 bg-white border border-dashed border-slate-300 rounded-lg text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-3 group"
                >
                  <Plus size={18} />
                  <span className="uppercase text-xs tracking-widest">Add Production Phase</span>
                </button>
              </div>

              <div className="px-6 py-5 border-t border-slate-100 bg-white flex justify-end">
                <button
                  onClick={() => setShowStepModal(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 hover:shadow-xl transition-all uppercase tracking-widest flex items-center gap-2"
                >
                  <span>Save Workflow</span>
                  <CheckCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Modal for Production Move */}
      {
        productionConfirmOrder && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Settings className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Move to Production?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                This will update the order status to <strong>Processing</strong> and make it available for production planning.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProductionConfirmOrder(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // Optimistic Update
                      setOrders(prev => prev.map(o => o._id === productionConfirmOrder._id ? { ...o, status: 'Processing', orderStage: 'Processing' } : o));

                      await updateOrderStatus(productionConfirmOrder._id, 'Processing');
                      showNotification('Order moved to Production Planning!');
                      setProductionConfirmOrder(null);

                      // Background Sync
                      getAllOrders().then(res => {
                        setOrders(Array.isArray(res) ? res : res.data || []);
                      }).catch(console.error);

                    } catch (err) {
                      console.error(err);
                      showNotification('Failed to update status', 'error');
                      fetchData(); // Revert
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}


