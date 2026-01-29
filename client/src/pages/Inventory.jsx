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
    Plus,
    X,
    FileText,
    Truck,
    Settings,
    Trash2,
    Edit2,
    ArrowRight
} from 'lucide-react';
import {
    getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial,
    getMaterialRequests, createMaterialRequest, getNextMRNumber,
    getGRNs, createGRN, getNextGRNNumber,
    getWIPStock, createWIPStock,
    getFinishedGoods, createFinishedGood,
    getRejectedGoods, createRejectedGood
} from '../services/api';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('raw-material-master');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Data states
    const [rawMaterials, setRawMaterials] = useState([]);
    const [materialRequests, setMaterialRequests] = useState([]);
    const [grns, setGrns] = useState([]);
    const [wipStock, setWipStock] = useState([]);
    const [finishedGoods, setFinishedGoods] = useState([]);
    const [rejectedGoods, setRejectedGoods] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            switch (activeTab) {
                case 'raw-material-master':
                    const rm = await getRawMaterials();
                    setRawMaterials(rm || []);
                    break;
                case 'material-request':
                    const mr = await getMaterialRequests();
                    setMaterialRequests(mr || []);
                    break;
                case 'grn':
                    const g = await getGRNs();
                    setGrns(g || []);
                    break;
                case 'wip':
                    const wip = await getWIPStock();
                    setWipStock(wip || []);
                    break;
                case 'finished':
                    const fg = await getFinishedGoods();
                    setFinishedGoods(fg || []);
                    break;
                case 'rejected':
                    const rej = await getRejectedGoods();
                    setRejectedGoods(rej || []);
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async (data) => {
        try {
            if (editingItem) {
                if (activeTab === 'raw-material-master') {
                    await updateRawMaterial(editingItem._id, data);
                }
            } else {
                switch (activeTab) {
                    case 'raw-material-master': await createRawMaterial(data); break;
                    case 'material-request': await createMaterialRequest(data); break;
                    case 'grn': await createGRN(data); break;
                    case 'wip': await createWIPStock(data); break;
                    case 'finished': await createFinishedGood(data); break;
                    case 'rejected': await createRejectedGood(data); break;
                }
            }
            setIsAddModalOpen(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            console.error("Operation failed", error);
            alert("Failed to save. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            if (activeTab === 'raw-material-master') {
                await deleteRawMaterial(id);
                fetchData();
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Tab configuration
    const tabs = [
        {
            id: 'raw-material-master',
            label: 'Raw Material Master',
            icon: Package,
            style: {
                activeBg: 'bg-blue-100',
                activeText: 'text-blue-600',
                indicator: 'bg-blue-500'
            }
        },
        {
            id: 'material-request',
            label: 'Material Request',
            icon: FileText,
            style: {
                activeBg: 'bg-purple-100',
                activeText: 'text-purple-600',
                indicator: 'bg-purple-500'
            }
        },
        {
            id: 'grn',
            label: 'GRN',
            icon: Truck,
            style: {
                activeBg: 'bg-orange-100',
                activeText: 'text-orange-600',
                indicator: 'bg-orange-500'
            }
        },
        {
            id: 'wip',
            label: 'WIP',
            icon: Factory,
            style: {
                activeBg: 'bg-amber-100',
                activeText: 'text-amber-600',
                indicator: 'bg-amber-500'
            }
        },
        {
            id: 'finished',
            label: 'Finished Goods',
            icon: CheckCircle2,
            style: {
                activeBg: 'bg-emerald-100',
                activeText: 'text-emerald-600',
                indicator: 'bg-emerald-500'
            }
        },
        {
            id: 'rejected',
            label: 'Rejected Goods',
            icon: AlertTriangle,
            style: {
                activeBg: 'bg-red-100',
                activeText: 'text-red-600',
                indicator: 'bg-red-500'
            }
        }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                        <p className="text-slate-500 mt-1">Comprehensive material tracking and control</p>
                    </div>
                    {activeTab !== 'wip' && activeTab !== 'finished' && (
                        <button
                            onClick={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span>Add {tabs.find(t => t.id === activeTab)?.label}</span>
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex items-center gap-2 px-6 py-4 transition-all duration-300 whitespace-nowrap
                                    ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                <div className={`p-2 rounded-md ${isActive ? `${tab.style.activeBg} ${tab.style.activeText}` : 'bg-slate-100'}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="text-sm">{tab.label}</span>
                                {isActive && (
                                    <motion.div layoutId="activeTabIndicator" className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.style.indicator}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'raw-material-master' && <RawMaterialMasterView data={rawMaterials} onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }} onDelete={handleDelete} />}
                            {activeTab === 'material-request' && <MaterialRequestView data={materialRequests} />}
                            {activeTab === 'grn' && <GRNView data={grns} />}
                            {activeTab === 'wip' && <WIPView data={wipStock} />}
                            {activeTab === 'finished' && <FinishedGoodsView data={finishedGoods} />}
                            {activeTab === 'rejected' && <RejectedGoodsView data={rejectedGoods} />}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <InventoryModal
                        type={activeTab}
                        item={editingItem}
                        onClose={() => setIsAddModalOpen(false)}
                        onSubmit={handleAddOrEdit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- View Components ---

const RawMaterialMasterView = ({ data, onEdit, onDelete }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Code & Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Specs (Thick/Finish/Color)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Type & Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Qty (UOM)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.code}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-slate-700">{item.thickness || 'N/A'} / {item.finish || 'N/A'} / {item.colour || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-slate-700">{item.type || 'N/A'} / {item.size || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className="font-bold text-slate-900">{item.qty}</span> <span className="text-slate-500 text-sm">{item.uom}</span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => onEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                <button onClick={() => onDelete(item._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MaterialRequestView = ({ data }) => (
    <div className="space-y-6">
        {data.map((mr) => (
            <div key={mr._id} className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">{mr.mrNo}</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar size={14} /> {new Date(mr.requestDate).toLocaleDateString()}
                        </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${mr.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {mr.status}
                    </span>
                </div>
                <div className="p-0">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-3 font-semibold text-slate-600">Item Details</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Specifications</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Type & Size</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-right">Qty & UOM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(mr.items || []).map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{item.itemName}</div>
                                        <div className="text-xs text-slate-500">Code: {item.itemCode || 'N/A'}</div>
                                        {item.description && <div className="text-xs text-slate-400 mt-1 italic">{item.description}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-700 text-xs">
                                            <span className="text-slate-400">Thick:</span> {item.thickness || '-'}<br />
                                            <span className="text-slate-400">Finish:</span> {item.finish || '-'}<br />
                                            <span className="text-slate-400">Color:</span> {item.colour || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="text-slate-700 font-medium">{item.type || 'N/A'}</div>
                                        <div className="text-slate-500 mt-1">{item.size || 'N/A'}</div>
                                        {item.expDate && <div className="text-red-500 mt-1">Exp: {new Date(item.expDate).toLocaleDateString()}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-lg font-black text-blue-700">{item.qty}</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase">{item.uom}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
    </div>
);

const GRNView = ({ data }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">GRN No & Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Supplier & PO</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">IQC & Transport</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Items Detail</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((grn) => (
                    <tr key={grn._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{grn.grnNumber}</div>
                            <div className="text-xs text-slate-500">{new Date(grn.receivedDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{grn.supplierName}</div>
                            <div className="text-xs text-slate-400">Code: {grn.supplierCode}</div>
                            <div className="text-xs text-blue-600 font-mono font-bold mt-1">PO: {grn.poNo}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <span className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-black ${grn.iqcStatus === 'OK' ? 'text-green-600 bg-green-50 border border-green-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                                    IQC: {grn.iqcStatus}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Via: {grn.modeOfTransport || 'Direct'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-slate-900">{grn.items.length} Items</div>
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">
                                {grn.items.map(i => i.itemName).join(", ")}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const WIPView = ({ data }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Job No</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Part Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thickness</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Qty</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((wip) => (
                    <tr key={wip._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-blue-600 font-bold">{wip.jobNo}</td>
                        <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{wip.partName}</div>
                            <div className="text-xs text-slate-500">{wip.partNo}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{wip.thickness}</td>
                        <td className="px-6 py-4 text-right font-bold">{wip.qty}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const FinishedGoodsView = ({ data }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Item No & Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Dates (Mfg/Exp)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Refs (PO/Inv)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((fg) => (
                    <tr key={fg._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{fg.partName}</div>
                            <div className="text-xs text-slate-500 font-mono">PN: {fg.partNo}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="font-black text-emerald-600">{fg.qty}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                            <div><span className="text-slate-400">Mfg:</span> {new Date(fg.mfgDate).toLocaleDateString()}</div>
                            {fg.expDate && <div><span className="text-slate-400">Exp:</span> {new Date(fg.expDate).toLocaleDateString()}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs">
                            <div className="text-slate-600 font-medium">PO: {fg.poNo || 'N/A'}</div>
                            <div className="text-slate-400">Inv: {fg.invoiceNo || 'N/A'}</div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const RejectedGoodsView = ({ data }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Part Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Rejected Qty</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">PO / Invoice</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((rej) => (
                    <tr key={rej._id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{rej.partName}</div>
                            <div className="text-xs text-red-500">{rej.partNo}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">{rej.qty}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{rej.reason || 'Not Specified'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            PO: {rej.poNo || 'N/A'}<br />Inv: {rej.invoiceNo || 'N/A'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- Modal Component ---

const InventoryModal = ({ type, item, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(item || {});

    const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderForm = () => {
        switch (type) {
            case 'raw-material-master':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Material Name</label>
                            <input required className="w-full p-2 border rounded" value={formData.name || ''} onChange={e => updateField('name', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Item Code</label>
                            <input required className="w-full p-2 border rounded" value={formData.code || ''} onChange={e => updateField('code', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UOM</label>
                            <input required className="w-full p-2 border rounded" value={formData.uom || ''} onChange={e => updateField('uom', e.target.value)} placeholder="kg, meters, etc" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                            <input className="w-full p-2 border rounded" value={formData.description || ''} onChange={e => updateField('description', e.target.value)} />
                        </div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Thickness</label><input className="w-full p-2 border rounded" value={formData.thickness || ''} onChange={e => updateField('thickness', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Finish</label><input className="w-full p-2 border rounded" value={formData.finish || ''} onChange={e => updateField('finish', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Colour</label><input className="w-full p-2 border rounded" value={formData.colour || ''} onChange={e => updateField('colour', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label><input className="w-full p-2 border rounded" value={formData.type || ''} onChange={e => updateField('type', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Size</label><input className="w-full p-2 border rounded" value={formData.size || ''} onChange={e => updateField('size', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Expiry Date</label><input type="date" className="w-full p-2 border rounded" value={formData.expDate ? formData.expDate.slice(0, 10) : ''} onChange={e => updateField('expDate', e.target.value)} /></div>
                    </div>
                );
            case 'material-request':
                // Initialize items array if not present
                if (!formData.items) {
                    formData.items = [{ itemName: '', itemCode: '', qty: 0, uom: '' }];
                }
                const firstItem = formData.items[0];
                const updateFirstItem = (field, value) => {
                    const newItems = [...formData.items];
                    newItems[0] = { ...newItems[0], [field]: value };
                    updateField('items', newItems);
                };

                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">MR Number</label>
                                <input readOnly className="w-full p-2 border rounded bg-slate-50 font-bold text-blue-700" value={formData.mrNo || ''} placeholder="Click Auto to generate" />
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    const { mrNo } = await getNextMRNumber();
                                    updateField('mrNo', mrNo);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition"
                            >
                                Auto
                            </button>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Item Name *</label>
                            <input required className="w-full p-2 border rounded" value={firstItem.itemName || ''} onChange={e => updateFirstItem('itemName', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Item Code</label>
                            <input className="w-full p-2 border rounded" value={firstItem.itemCode || ''} onChange={e => updateFirstItem('itemCode', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Qty (Number) *</label>
                            <input required type="number" className="w-full p-2 border rounded" value={firstItem.qty || ''} onChange={e => updateFirstItem('qty', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">UOM *</label>
                            <input required className="w-full p-2 border rounded" value={firstItem.uom || ''} onChange={e => updateFirstItem('uom', e.target.value)} placeholder="kg, meters, etc" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Exp Date</label>
                            <input type="date" className="w-full p-2 border rounded" value={firstItem.expDate ? firstItem.expDate.slice(0, 10) : ''} onChange={e => updateFirstItem('expDate', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                            <input className="w-full p-2 border rounded" value={firstItem.description || ''} onChange={e => updateFirstItem('description', e.target.value)} />
                        </div>
                        <div className="col-span-2 grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100 mt-2">
                            <h4 className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specifications</h4>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Thickness</label><input className="w-full p-1.5 text-sm border rounded" value={firstItem.thickness || ''} onChange={e => updateFirstItem('thickness', e.target.value)} /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Finish</label><input className="w-full p-1.5 text-sm border rounded" value={firstItem.finish || ''} onChange={e => updateFirstItem('finish', e.target.value)} /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Colour</label><input className="w-full p-1.5 text-sm border rounded" value={firstItem.colour || ''} onChange={e => updateFirstItem('colour', e.target.value)} /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label><input className="w-full p-1.5 text-sm border rounded" value={firstItem.type || ''} onChange={e => updateFirstItem('type', e.target.value)} /></div>
                            <div className="col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Size</label><input className="w-full p-1.5 text-sm border rounded" value={firstItem.size || ''} onChange={e => updateFirstItem('size', e.target.value)} /></div>
                        </div>
                    </div>
                );
            case 'grn':
                if (!formData.items) {
                    formData.items = [{ itemCode: '', itemName: '', qty: 0, uom: '', mfgDate: '', expDate: '' }];
                }

                const addItem = () => {
                    const newItems = [...formData.items, { itemCode: '', itemName: '', qty: 0, uom: '', mfgDate: '', expDate: '' }];
                    updateField('items', newItems);
                };

                const updateItem = (index, field, value) => {
                    const newItems = [...formData.items];
                    newItems[index] = { ...newItems[index], [field]: value };
                    updateField('items', newItems);
                };

                const removeItem = (index) => {
                    if (formData.items.length <= 1) return;
                    const newItems = formData.items.filter((_, i) => i !== index);
                    updateField('items', newItems);
                };

                return (
                    <div className="space-y-6">
                        <section className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="col-span-2 flex justify-between items-end mb-2">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">GRN Number</label>
                                    <div className="flex gap-2">
                                        <input readOnly className="flex-1 p-2 border rounded bg-white font-bold text-blue-700" value={formData.grnNumber || ''} placeholder="Click Auto to generate" />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const { grnNumber } = await getNextGRNNumber();
                                                updateField('grnNumber', grnNumber);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition"
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier Name</label>
                                <input className="w-full p-2 border rounded" value={formData.supplierName || ''} onChange={e => updateField('supplierName', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Supplier Code</label>
                                <input className="w-full p-2 border rounded" value={formData.supplierCode || ''} onChange={e => updateField('supplierCode', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PO Number</label>
                                <input className="w-full p-2 border rounded" value={formData.poNo || ''} onChange={e => updateField('poNo', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Invoice No</label>
                                <input className="w-full p-2 border rounded" value={formData.invoiceNo || ''} onChange={e => updateField('invoiceNo', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Invoice Date</label>
                                <input type="date" className="w-full p-2 border rounded" value={formData.invoiceDate ? formData.invoiceDate.slice(0, 10) : ''} onChange={e => updateField('invoiceDate', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mode of Transport</label>
                                <input className="w-full p-2 border rounded" value={formData.modeOfTransport || ''} onChange={e => updateField('modeOfTransport', e.target.value)} placeholder="e.g. Courier, Vehicle, Hand" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">IQC Status</label>
                                <select className="w-full p-2 border rounded font-bold" value={formData.iqcStatus || 'OK'} onChange={e => updateField('iqcStatus', e.target.value)}>
                                    <option value="OK">OK ✅</option>
                                    <option value="NOT OK">NOT OK ❌</option>
                                </select>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Received Items</h3>
                                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition shadow-sm">
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>

                            {formData.items.map((item, index) => (
                                <div key={index} className="p-4 bg-white border border-slate-200 rounded-md relative group hover:border-blue-200 transition-colors shadow-sm">
                                    {formData.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition opacity-0 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Item Name</label>
                                            <input className="w-full p-2 text-sm border rounded" value={item.itemName || ''} onChange={e => updateItem(index, 'itemName', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Item Code</label>
                                            <input className="w-full p-2 text-sm border rounded" value={item.itemCode || ''} onChange={e => updateItem(index, 'itemCode', e.target.value)} />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Qty</label>
                                                <input type="number" className="w-full p-2 text-sm border rounded" value={item.qty || ''} onChange={e => updateItem(index, 'qty', e.target.value)} />
                                            </div>
                                            <div className="w-20">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">UOM</label>
                                                <input className="w-full p-2 text-sm border rounded" value={item.uom || ''} onChange={e => updateItem(index, 'uom', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mfg Date</label>
                                            <input type="date" className="w-full p-2 text-sm border rounded" value={item.mfgDate ? item.mfgDate.slice(0, 10) : ''} onChange={e => updateItem(index, 'mfgDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exp Date</label>
                                            <input type="date" className="w-full p-2 text-sm border rounded" value={item.expDate ? item.expDate.slice(0, 10) : ''} onChange={e => updateItem(index, 'expDate', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                );

            case 'wip':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Job No</label><input className="w-full p-2 border rounded" onChange={e => updateField('jobNo', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part No</label><input className="w-full p-2 border rounded" onChange={e => updateField('partNo', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part Name</label><input className="w-full p-2 border rounded" onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Thickness</label><input className="w-full p-2 border rounded" onChange={e => updateField('thickness', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Qty</label><input type="number" className="w-full p-2 border rounded" onChange={e => updateField('qty', e.target.value)} /></div>
                    </div>
                );
            case 'finished':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part No</label><input className="w-full p-2 border rounded" onChange={e => updateField('partNo', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part Name</label><input className="w-full p-2 border rounded" onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Qty</label><input type="number" className="w-full p-2 border rounded" onChange={e => updateField('qty', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mfg Date</label><input type="date" className="w-full p-2 border rounded" onChange={e => updateField('mfgDate', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PO No</label><input className="w-full p-2 border rounded" onChange={e => updateField('poNo', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Invoice No</label><input className="w-full p-2 border rounded" onChange={e => updateField('invoiceNo', e.target.value)} /></div>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part No</label><input className="w-full p-2 border rounded" onChange={e => updateField('partNo', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Part Name</label><input className="w-full p-2 border rounded" onChange={e => updateField('partName', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rejected Qty</label><input type="number" className="w-full p-2 border rounded text-red-600 font-bold" onChange={e => updateField('qty', e.target.value)} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mfg Date</label><input type="date" className="w-full p-2 border rounded" onChange={e => updateField('mfgDate', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Reason for Rejection</label><textarea rows="3" className="w-full p-2 border rounded" onChange={e => updateField('reason', e.target.value)} /></div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-md shadow-md w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{item ? 'Edit' : 'Add New'} {type.replace('-', ' ').toUpperCase()}</h2>
                        <p className="text-xs text-slate-500 mt-1">Please fill in all the required fields correctly.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-slate-200"><X size={20} className="text-slate-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
                    {renderForm()}
                </form>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                    <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md hover:bg-white transition text-slate-600 font-medium">Cancel</button>
                    <button onClick={handleSubmit} className="px-10 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-bold shadow-sm shadow-blue-200">Save {type.replace('-', ' ')}</button>
                </div>
            </motion.div>
        </div>
    );
};

export default Inventory;

