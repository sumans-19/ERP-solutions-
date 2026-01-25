import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Package, ShoppingCart } from 'lucide-react';
import { getAllItems, getAllOrders, createOrder, updateOrder, deleteOrder, updateOrderStatus } from '../services/api';

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
  priority: 'Normal'
});

export default function Orders() {
  const [activeView, setActiveView] = useState('list');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Form states
  const [partyName, setPartyName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(getTodayString());
  const [estDate, setEstDate] = useState('');
  const [itemRows, setItemRows] = useState([createNewItemRow()]);
  const [notes, setNotes] = useState('');

  // Fetch items and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, ordersRes] = await Promise.all([
          getAllItems(),
          getAllOrders()
        ]);
        setItems(Array.isArray(itemsRes) ? itemsRes : itemsRes.data || []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
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
      } else {
        row.item = null;
        row.itemName = value;
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
          priority: r.priority || 'Normal'
        })),
        notes: notes.trim(),
        status: 'New'
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
      setEditingOrderId(null);
      setPartyName('');
      setPoNumber('');
      setPoDate(getTodayString());
      setEstDate('');
      setItemRows([createNewItemRow()]);
      setNotes('');
      setActiveView('list');

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

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
      priority: item.priority
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-500 text-sm mt-1">{editingOrderId ? 'Edit order' : 'Create and manage purchase orders'}</p>
          </div>
          {activeView === 'list' && (
            <button
              onClick={() => {
                setEditingOrderId(null);
                setPartyName('');
                setPoNumber('');
                setPoDate(getTodayString());
                setEstDate('');
                setItemRows([createNewItemRow()]);
                setNotes('');
                setActiveView('create');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
            >
              <Plus size={20} /> New Order
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <span>✓</span> {message}
          </div>
        )}

        {/* Create Form */}
        {activeView === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingOrderId ? 'Edit Order' : 'Create New Order'}</h2>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">CUSTOMER NAME *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">PO NUMBER</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="E.g., PO-2024-001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">PO DATE</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={poDate}
                  onChange={e => setPoDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">DELIVERY DATE</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={estDate}
                    onChange={e => setEstDate(e.target.value)}
                  />
                  {estDate && (
                    <button
                      onClick={applyOverallDateToItems}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-xs whitespace-nowrap"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">#</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Item Name</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Delivery</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Qty</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Unit</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Priority</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-700">Rate</th>
                    <th className="p-3 text-right text-xs font-semibold text-slate-700">Amount</th>
                    <th className="p-3 text-center text-xs font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {itemRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <input
                          list="items-list"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={row.itemName || ''}
                          onChange={e => handleItemRowChange(index, 'item', e.target.value)}
                          placeholder="Type item name..."
                        />
                        <datalist id="items-list">
                          {items.map(i => <option key={i._id} value={i.name} />)}
                        </datalist>
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={row.deliveryDate}
                          onChange={e => handleItemRowChange(index, 'deliveryDate', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={row.quantity}
                          onChange={e => handleItemRowChange(index, 'quantity', e.target.value)}
                          min="1"
                        />
                      </td>
                      <td className="p-3 text-xs text-slate-600 bg-gray-50 rounded">{row.unit}</td>
                      <td className="p-3">
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={row.priority}
                          onChange={e => handleItemRowChange(index, 'priority', e.target.value)}
                        >
                          <option>Normal</option>
                          <option>High</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={row.rate}
                          onChange={e => handleItemRowChange(index, 'rate', e.target.value)}
                          min="0"
                        />
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-700">₹{parseFloat(row.amount).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeRow(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addNewRow}
                className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 text-sm border-t"
              >
                + Add Item
              </button>
            </div>

            {/* Summary & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2">NOTES / REMARKS</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special instructions..."
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Items</span>
                    <span className="font-bold text-lg text-slate-900">{totalQty}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="text-slate-600 font-medium mb-1">Total Amount</div>
                    <div className="text-3xl font-bold text-blue-600">₹{parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end border-t border-slate-200 pt-6">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={loading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-slate-400 flex items-center gap-2"
              >
                {loading ? 'Saving...' : editingOrderId ? 'Update Order' : 'Save Order'}
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {activeView === 'list' && (
          <>
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Orders Yet</h3>
                <p className="text-slate-500 mb-6">Create your first purchase order to get started</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} /> Create Order
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    key={order._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-slate-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Customer</p>
                          <p className="text-lg font-bold text-slate-900">{order.partyName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">PO Number</p>
                          <p className="text-lg font-bold text-slate-700">{order.poNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Items</p>
                          <p className="text-lg font-bold text-blue-600">{order.items?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Amount</p>
                          <p className="text-lg font-bold text-green-600">₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {order.status || 'New'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>PO: {formatDate(order.poDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Delivery: {formatDate(order.estimatedDeliveryDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package size={14} />
                          <span>{order.items?.length || 0} Item(s)</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleEditOrder(order)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
