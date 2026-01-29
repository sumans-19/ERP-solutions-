import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Package, ShoppingCart, User, ChevronDown, Settings, X, Layers, List, Search, Filter, ArrowUpRight, Ban, CheckCircle2, CheckCircle, Activity, PlayCircle } from 'lucide-react';
import { getAllItems, getAllOrders, createOrder, updateOrder, deleteOrder, updateOrderStatus, getAllParties, getEmployees } from '../services/api';
import axios from 'axios';
import OrderTreeView from './Orders/OrderTreeView';
import OrderStageGate from './Orders/OrderStageGate';
import { canCreate, canEdit, canDelete } from '../utils/permissions';

const getTodayString = () => new Date().toISOString().slice(0, 10);

const createNewItemRow = () => ({
  id: Date.now(),
  item: null,
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
  const [activeView, setActiveView] = useState('stages');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stageUpdating, setStageUpdating] = useState(null);

  // Form states
  const [partyName, setPartyName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(getTodayString());
  const [estDate, setEstDate] = useState('');
  const [itemRows, setItemRows] = useState([createNewItemRow()]);
  const [notes, setNotes] = useState('');

  // Fetch items, orders and parties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, ordersRes, partiesRes, employeesRes] = await Promise.all([
          getAllItems(),
          getAllOrders(),
          getAllParties(),
          getEmployees()
        ]);
        setItems(Array.isArray(itemsRes) ? itemsRes : itemsRes.data || []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
        setParties(Array.isArray(partiesRes) ? partiesRes : partiesRes.data || []);
        setEmployees(Array.isArray(employeesRes) ? employeesRes : employeesRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleItemRowChange = (index, field, value) => {
    const newRows = [...itemRows];
    const row = newRows[index];
    row[field] = value;

    if (field === 'item') {
      let selectedItem = items.find(i => i._id === value);
      if (!selectedItem) {
        selectedItem = items.find(i => i.name?.toLowerCase() === String(value).toLowerCase());
      }
      if (selectedItem) {
        row.item = selectedItem._id;
        row.itemName = selectedItem.name;
        row.unit = selectedItem.unit || 'NONE';
        row.rate = parseFloat(selectedItem.salePrice) || 0;
        row.manufacturingSteps = selectedItem.processes || [];
        row.currentStock = selectedItem.currentStock || 0;
      } else {
        row.item = null;
        row.itemName = value;
        row.manufacturingSteps = [];
        row.currentStock = 0;
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

  const handleSaveOrder = async () => {
    if (!partyName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (itemRows.length === 0) {
      setError('Add at least one item');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const orderData = {
        partyName: partyName.trim(),
        poNumber: poNumber.trim(),
        poDate,
        estimatedDeliveryDate: estDate,
        items: itemRows.map(r => ({
          item: r.item,
          itemName: r.itemName,
          quantity: parseFloat(r.quantity) || 1,
          unit: r.unit,
          rate: parseFloat(r.rate) || 0,
          amount: parseFloat(r.amount) || 0,
          deliveryDate: r.deliveryDate,
          priority: r.priority || 'Normal',
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
        setMessage('Order updated successfully!');
      } else {
        await createOrder(orderData);
        setMessage('Order created successfully!');
      }

      // Reload orders
      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);

      // Reset form
      handleCancel();

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (orderId, newStage, reason = '') => {
    setStageUpdating(orderId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.patch(`${apiUrl}/api/orders/${orderId}/stage`, { stage: newStage, reason });
      setMessage(`Order moved to ${newStage}`);

      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError('Failed to update stage');
    } finally {
      setStageUpdating(null);
    }
  };

  const handleHoldResume = async (order, action) => {
    setStageUpdating(order._id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      if (action === 'hold') {
        const reason = window.prompt('Enter reason for Hold:');
        if (reason === null) return;
        await axios.patch(`${apiUrl}/api/orders/${order._id}/hold`, { reason });
        setMessage('Order put ON HOLD');
      } else {
        await axios.patch(`${apiUrl}/api/orders/${order._id}/resume`);
        setMessage('Order Resumed');
      }

      const ordersRes = await getAllOrders();
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(`Failed to ${action} order`);
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

  const handleEditOrder = (order) => {
    setEditingOrderId(order._id);
    setPartyName(order.partyName);
    setPoNumber(order.poNumber);
    setPoDate(new Date(order.poDate).toISOString().slice(0, 10));
    setEstDate(order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10) : '');
    setNotes(order.notes);
    setItemRows(order.items.map((item, idx) => ({
      id: idx,
      item: item.item?._id || item.item || null,
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
    setError(null);
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
    setError(null);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this order?')) {
      try {
        setLoading(true);
        await deleteOrder(id);
        setMessage('Order deleted successfully');

        // Reload orders
        const ordersRes = await getAllOrders();
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);

        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete order: ' + (err?.response?.data?.message || err.message));
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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2 text-sm font-medium">
          <span>⚠️</span> {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 flex items-center gap-2 text-sm font-medium">
          <span>✓</span> {message}
        </div>
      )}

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
                          className={`w-full border rounded px-2 py-1.5 text-xs font-bold uppercase outline-none ${row.priority === 'High' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-300 text-slate-600'}`}
                          value={row.priority}
                          onChange={e => handleItemRowChange(index, 'priority', e.target.value)}
                        >
                          <option>Normal</option>
                          <option>High</option>
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
                        <td colSpan="10" className="px-3 py-1.5 text-[10px] border-t border-slate-100">
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 uppercase font-semibold">Stock Available: <span className="text-slate-900">{row.currentStock || 0} {row.unit}</span></span>
                            {row.currentStock < row.quantity && (
                              <span className="text-orange-600 font-bold flex items-center gap-1">⚠️ SHORTFALL</span>
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
            <div className="bg-white rounded-md shadow-sm p-16 text-center border border-dashed border-slate-300">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={24} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No orders found</h3>
              <p className="text-slate-500 mb-6 text-sm">Try adjusting your filters or create a new order.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="bg-white rounded-md shadow-sm border border-slate-200 hover:border-blue-300 transition-colors overflow-hidden flex flex-col md:flex-row mb-3 group">
                <div className="p-5 flex-1 select-none">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Customer</span>
                      <span className="font-bold text-slate-800 block truncate text-sm">{order.partyName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PO Number</span>
                      <span className="font-mono text-slate-600 block truncate text-sm">{order.poNumber || 'NOT SET'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount</span>
                      <span className="font-bold text-slate-800 block font-mono text-sm">₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Workflow Stage</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${order.orderStage === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          order.orderStage === 'Processing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            order.orderStage === 'FQC' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              order.orderStage === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                order.orderStage === 'OnHold' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                          {order.orderStage || 'New'}
                        </span>
                        {order.orderStage === 'OnHold' && (
                          <span className="text-[10px] text-rose-400 italic font-medium truncate max-w-[100px]" title={order.holdReason}>
                            ({order.holdReason})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3 mt-1">
                    <div className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(order.poDate)}</div>
                    <div className="flex items-center gap-1.5"><Package size={12} /> {order.items?.length || 0} ITEMS</div>
                    <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"><Plus size={10} /> {order.totalQty || 0} QTY</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 md:w-32 flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100">
                  {canEdit('orders') && (
                    <button onClick={() => handleEditOrder(order)} className="flex-1 p-1.5 bg-white border border-slate-200 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center">
                      <Edit2 size={14} />
                    </button>
                  )}
                  {(order.status === 'New' || order.status === 'Confirmed') && canEdit('orders') && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Move this order to Production? This will generate Job Cards.')) {
                          try {
                            setLoading(true);
                            await updateOrderStatus(order._id, 'Processing');
                            setMessage('Order moved to Production successfully!');
                            const res = await getAllOrders();
                            setOrders(Array.isArray(res) ? res : res.data || []);
                          } catch (err) {
                            console.error(err);
                            setError('Failed to update status');
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      className="flex-1 p-1.5 bg-white border border-slate-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center"
                      title="Move to Production"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  {canDelete('orders') && (
                    <button onClick={() => handleDeleteOrder(order._id)} className="flex-1 p-1.5 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center" title="Delete Order">
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Stage Transitions */}
                  <div className="md:border-t border-slate-200 pt-2 flex flex-col gap-2">
                    {order.orderStage !== 'OnHold' ? (
                      <button
                        onClick={() => handleHoldResume(order, 'hold')}
                        className="p-1.5 bg-white border border-rose-100 text-rose-500 rounded-md hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                        title="Put On Hold"
                      >
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHoldResume(order, 'resume')}
                        className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
                        title="Resume Work"
                      >
                        <PlayCircle size={14} />
                      </button>
                    )}

                    <div className="relative group/stage">
                      <button className="w-full p-1.5 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center hover:bg-blue-100 transition-all border border-blue-100">
                        <ArrowUpRight size={14} />
                      </button>
                      <div className="hidden group-hover/stage:flex absolute right-full top-0 mr-2 bg-white shadow-sm border border-slate-200 rounded-md p-2 z-[50] flex-col min-w-[150px]">
                        {['New', 'Mapped', 'Assigned', 'Processing', 'MFGCompleted', 'FQC', 'Documentation', 'Packing', 'Dispatch', 'Completed'].map(s => (
                          <button
                            key={s}
                            onClick={() => handleUpdateStage(order._id, s)}
                            className={`text-left px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 ${order.orderStage === s ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
    </div >
  );
}


