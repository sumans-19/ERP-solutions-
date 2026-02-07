import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';

const SearchableEmployeeSelect = ({ employees, onSelect, placeholder = "Select Employee..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (emp) => {
        onSelect(emp._id);
        setSearchQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded px-8 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                            <div
                                key={emp._id}
                                className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none group"
                                onClick={() => handleSelect(emp)}
                            >
                                <div>
                                    <p className="text-[10px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                        {emp.name || emp.fullName}
                                    </p>
                                    <p className="text-[8px] text-slate-400">{emp.designation || 'Staff'}</p>
                                </div>
                                <Check size={10} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center text-slate-400 text-[10px] italic">
                            No employees found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableEmployeeSelect;
