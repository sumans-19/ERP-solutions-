import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Factory,
    CheckCircle2,
    Search,
    Filter,
    AlertTriangle,
    Calendar,
    Clock,
    User,
    MoreVertical,
    Plus,
    X
} from 'lucide-react';
import { getAllItems, getAllOrders, getInventory, addInventoryItem } from '../services/api';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('raw-materials');
    const [items, setItems] = useState([]); // For WIP/Finished
    const [orders, setOrders] = useState([]); // For linking WIP/Finished
    const [rawMaterials, setRawMaterials] = useState([]); // New dedicated state
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Filter States
    const [filterStatus, setFilterStatus] = useState('all'); // all, available, low-stock, expired
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState('all'); // all, this-month, last-month, this-year. Default to active/this-month? Let's default to 'all' or 'this-month' as per prev state.
    // Actually, distinct from logic. Let's use 'all' as default.
    // Previous state was 'active' vs 'all' or boolean. 
    // Let's stick to: 'all', 'this-month', 'last-month', 'this-year'.
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsData, ordersData, inventoryData] = await Promise.all([
                getAllItems(),
                getAllOrders(),
                getInventory()
            ]);
            setItems(itemsData || []);
            setOrders(ordersData || []);
            setRawMaterials(inventoryData || []);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to find Order for an Item
    const getItemOrder = (itemId) => {
        const order = orders.find(o => o.items?.some(i => i.item === itemId || i.item?._id === itemId));
        return order ? { poNumber: order.poNumber, partyName: order.partyName } : null;
    };

    // Helper for Raw Material Status Logic
    const getMaterialStatus = (material) => {
        const today = new Date();
        const expiryDate = new Date(material.expiry);

        if (expiryDate < today) return 'Expired';
        if (material.qty <= 20) return 'Low Stock';
        return 'Available';
    };

    const handleAddMaterial = async (materialData) => {
        try {
            await addInventoryItem(materialData);
            setIsAddModalOpen(false);
            fetchData(); // Refresh list to show new item
        } catch (error) {
            console.error("Failed to add material", error);
            alert("Failed to add material. Please try again.");
        }
    };

    const getWIP = () => {
        const wipStates = ['Assigned', 'Manufacturing', 'Verification', 'Documentation'];
        return items.filter(item =>
            item.processes && item.processes.length > 0 &&
            wipStates.includes(item.state)
        ).map(item => ({
            ...item,
            orderInfo: getItemOrder(item._id)
        }));
    };

    const getFinishedGoods = () => {
        return items.filter(item =>
            item.processes && item.processes.length > 0 &&
            item.state === 'Completed'
        ).map(item => ({
            ...item,
            orderInfo: getItemOrder(item._id)
        }));
    };

    // const rawMaterials = getRawMaterials(); // Old derivation removed
    const wipItems = getWIP();
    const finishedGoods = getFinishedGoods();

    const filteredData = () => {
        let data = [];
        const term = searchTerm.toLowerCase();

        // 1. Select Source Data
        switch (activeTab) {
            case 'raw-materials':
                data = rawMaterials;
                break;
            case 'wip':
                data = wipItems;
                break;
            case 'finished':
                data = finishedGoods;
                break;
            default:
                data = [];
        }

        // 2. Apply Search
        data = data.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(term);
            const codeMatch = item.code && item.code.toLowerCase().includes(term);
            const poMatch = item.orderInfo?.poNumber && item.orderInfo.poNumber.toLowerCase().includes(term);
            return nameMatch || codeMatch || poMatch;
        });

        // 3. Apply Status Filter
        if (activeTab === 'raw-materials' && filterStatus !== 'all') {
            data = data.filter(item => {
                const status = getMaterialStatus(item);
                return status.toLowerCase().replace(' ', '-') === filterStatus;
            });
        }

        // 4. Apply Date Filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            data = data.filter(item => {
                // Fallback to createdAt or nothing? 
                // DB has createdAt.
                const dateToCheck = item.createdAt ? new Date(item.createdAt) : null;
                if (!dateToCheck) return false;

                switch (dateFilter) {
                    case 'this-month':
                        return dateToCheck.getMonth() === currentMonth && dateToCheck.getFullYear() === currentYear;
                    case 'last-month':
                        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                        return dateToCheck.getMonth() === lastMonth && dateToCheck.getFullYear() === lastMonthYear;
                    case 'this-year':
                        return dateToCheck.getFullYear() === currentYear;
                    default:
                        return true;
                }
            });
        }

        return data;
    };

    // Filter Options
    const filterOptions = [
        { id: 'all', label: 'All Status' },
        { id: 'available', label: 'Available' },
        { id: 'low-stock', label: 'Low Stock' },
        { id: 'expired', label: 'Expired' }
    ];

    const dateOptions = [
        { id: 'all', label: 'All Time' },
        { id: 'this-month', label: 'This Month' },
        { id: 'last-month', label: 'Last Month' },
        { id: 'this-year', label: 'This Year' }
    ];

    const TabButton = ({ id, label, icon: Icon, count, color }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
        relative flex items-center gap-2 px-6 py-4 transition-all duration-300
        ${activeTab === id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
      `}
        >
            <div className={`
        p-2 rounded-lg transition-all duration-300
        ${activeTab === id ? `bg-${color}-100 text-${color}-600` : 'bg-slate-100 text-slate-500'}
      `}>
                <Icon size={20} />
            </div>
            <div className="flex flex-col items-start">
                <span className={`text-sm font-semibold ${activeTab === id ? 'text-slate-900' : 'text-slate-900'}`}>
                    {label}
                </span>
                <span className="text-xs text-slate-400">
                    {count} Items
                </span>
            </div>

            {activeTab === id && (
                <motion.div
                    layoutId="activeTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${color}-500`}
                />
            )}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Add Material Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <AddMaterialModal
                        onClose={() => setIsAddModalOpen(false)}
                        onSubmit={handleAddMaterial}
                    />
                )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                        <p className="text-slate-500 mt-1">Material tracking across production stages</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={18} />
                        <span>Add Material</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-100">
                    <TabButton
                        id="raw-materials"
                        label="Raw Materials"
                        icon={Package}
                        count={rawMaterials.length}
                        color="blue"
                    />
                    <TabButton
                        id="wip"
                        label="Work In Progress"
                        icon={Factory}
                        count={wipItems.length}
                        color="amber"
                    />
                    <TabButton
                        id="finished"
                        label="Finished Goods"
                        icon={CheckCircle2}
                        count={finishedGoods.length}
                        color="emerald"
                    />
                </div>
            </div>

            {/* Controls Bar */}
            <div className="px-8 py-4 flex gap-4 items-center justify-between">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Status Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm shadow-sm font-medium transition-colors
                                ${filterStatus !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            <Filter size={16} />
                            <span>{filterOptions.find(f => f.id === filterStatus)?.label || 'Filter'}</span>
                        </button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20"
                                >
                                    {filterOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setFilterStatus(option.id);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors
                                                ${filterStatus === option.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-600'}
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Date Date Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm shadow-sm font-medium transition-colors
                                ${dateFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            <Calendar size={16} />
                            <span>{dateOptions.find(d => d.id === dateFilter)?.label || 'Date'}</span>
                        </button>

                        <AnimatePresence>
                            {isDateFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20"
                                >
                                    {dateOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setDateFilter(option.id);
                                                setIsDateFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors
                                                ${dateFilter === option.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-600'}
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto px-8 pb-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'raw-materials' && (
                                <RawMaterialsView materials={filteredData()} />
                            )}
                            {activeTab === 'wip' && (
                                <WIPView items={filteredData()} />
                            )}
                            {activeTab === 'finished' && (
                                <FinishedGoodsView items={filteredData()} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

// Add Material Modal Component
const AddMaterialModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        unit: 'Units',
        expiry: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Map form fields to backend schema
        onSubmit({
            name: formData.name,
            qty: parseInt(formData.quantity),
            unit: formData.unit,
            expiry: formData.expiry
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Add Raw Material</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Material Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Steel Sheet 2mm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input
                                required
                                type="number"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="kg, pcs..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                            <input
                                required
                                type="date"
                                value={formData.expiry}
                                onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Add Material
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Helper Icon for Modal
const XIcon = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18" />
        <path d="M6 6 18 18" />
    </svg>
);

// Sub-components for views

const RawMaterialsView = ({ materials }) => {
    // Re-using logic inside component for display or passed down?
    // It's cleaner to calculate status here if not passed. 
    // Wait, I didn't attach status in filteredData for rawMaterials.
    // Let's calculate it in the map.
    const today = new Date();

    const getStatus = (material) => {
        const expiry = new Date(material.expiry);
        if (expiry < today) return { label: 'Expired', class: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
        if (material.qty <= 20) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
        return { label: 'Available', class: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {materials.map((material, idx) => {
                const status = getStatus(material);
                const StatusIcon = status.icon;

                return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Package size={20} />
                            </div>
                            <span className={`
                                px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1
                                ${status.class}
                            `}>
                                {status.label === 'Expired' && <AlertTriangle size={10} />}
                                {status.label}
                            </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1 truncate" title={material.name}>
                            {material.name}
                        </h3>
                        <div className="text-2xl font-bold text-slate-900 mb-2">
                            {material.qty} <span className="text-sm font-normal text-slate-500">{material.unit}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="font-medium">Expiry: {new Date(material.expiry).toLocaleDateString()}</span>
                        </div>
                    </div>
                );
            })}
            {materials.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    No raw materials found.
                </div>
            )}
        </div>
    );
};

const WIPView = ({ items }) => {
    const getStageColor = (stage) => {
        switch (stage) {
            case 'Assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Manufacturing': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Verification': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Documentation': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job / Order</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stage</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignments</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-500">{item.category || 'Uncategorized'}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded inline-block text-slate-600 w-fit">
                                        {item.code || 'N/A'}
                                    </div>
                                    {item.orderInfo && (
                                        <div className="text-xs text-blue-600 font-medium">
                                            PO: {item.orderInfo.poNumber || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStageColor(item.state)}`}>
                                    {item.state}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex -space-x-2">
                                    {item.assignedEmployees?.slice(0, 3).map((emp, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600" title={emp.employeeName}>
                                            {emp.employeeName?.[0]}
                                        </div>
                                    ))}
                                    {(!item.assignedEmployees || item.assignedEmployees.length === 0) && (
                                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                {item.currentStock || item.openingQty || 0}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                No items currently in progress.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const FinishedGoodsView = ({ items }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
                <div key={item._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-slate-900 truncate pr-2">{item.name}</h3>
                            <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.code}</span>
                        </div>
                        {item.orderInfo && (
                            <div className="text-xs text-blue-600 font-medium mt-0.5">PO: {item.orderInfo.poNumber}</div>
                        )}
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <Clock size={14} />
                            <span>Completed: {item.stateHistory?.find(h => h.state === 'Completed')?.changedAt ? new Date(item.stateHistory?.find(h => h.state === 'Completed')?.changedAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>
                    <div className="text-right pl-4 border-l border-slate-100">
                        <div className="text-xl font-bold text-slate-900">{item.currentStock}</div>
                        <div className="text-xs text-slate-400">In Stock</div>
                    </div>
                </div>
            ))}
            {items.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    No finished goods found.
                </div>
            )}
        </div>
    );
};

export default Inventory;
