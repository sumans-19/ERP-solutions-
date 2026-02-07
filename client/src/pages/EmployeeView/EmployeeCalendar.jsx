import React, { useState, useEffect, useCallback } from 'react';
import { getCalendarEvents } from '../../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Package, Briefcase, Users, FileText, ClipboardList, ShieldAlert, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeView } from '../../contexts/EmployeeViewContext';

const EmployeeCalendar = () => {
    const { selectedEmployeeId, selectedEmployee } = useEmployeeView();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [calendarGrid, setCalendarGrid] = useState([]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const fetchEvents = useCallback(async () => {
        if (!selectedEmployeeId) return;
        setIsLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month - 1, 1).toISOString();
            const end = new Date(year, month + 2, 0).toISOString();
            const data = await getCalendarEvents(start, end, selectedEmployeeId);
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch employee calendar events:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, selectedEmployeeId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const formatDateKey = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const grid = [];
        // Previous month filler
        for (let i = 0; i < startingDayOfWeek; i++) {
            grid.push({ day: '', isCurrentMonth: false });
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const cellDate = new Date(year, month, i);
            const dateStr = formatDateKey(cellDate);
            const dayEvents = events.filter(e => e.date && formatDateKey(e.date) === dateStr);
            grid.push({
                day: i,
                date: cellDate,
                isCurrentMonth: true,
                events: dayEvents
            });
        }
        // Next month filler
        while (grid.length % 7 !== 0) {
            grid.push({ day: '', isCurrentMonth: false });
        }
        setCalendarGrid(grid);
    }, [currentDate, events]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
    };

    const isSameDay = (d1, d2) => formatDateKey(d1) === formatDateKey(d2);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'job': return <Briefcase size={16} className="text-amber-500" />;
            case 'task': return <CheckCircle size={16} className="text-emerald-500" />;
            case 'todo': return <ClipboardList size={16} className="text-indigo-500" />;
            default: return <FileText size={16} className="text-slate-400" />;
        }
    };

    const getSelectedDayEvents = () => {
        const dateStr = formatDateKey(selectedDate);
        return events.filter(e => e.date && formatDateKey(e.date) === dateStr);
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            {/* Main Calendar View */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
                <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <CalendarIcon size={20} className="text-blue-600" />
                            {months[currentDate.getMonth()]} <span className="text-slate-400">{currentDate.getFullYear()}</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                            Personal Schedule: {selectedEmployee?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all uppercase tracking-tight">
                            Today
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Content */}
                <div className="p-4 flex-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                            {daysOfWeek.map(day => (
                                <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-white">
                            {calendarGrid.map((cell, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => cell.isCurrentMonth && setSelectedDate(cell.date)}
                                    className={`
                                        border-b border-r border-slate-100 p-1.5 min-h-[80px] transition-all cursor-pointer relative group
                                        ${!cell.isCurrentMonth ? 'bg-slate-50/30' : 'hover:bg-blue-50/30'}
                                        ${cell.isCurrentMonth && isSameDay(cell.date, selectedDate) ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : ''}
                                    `}
                                >
                                    {cell.isCurrentMonth && (
                                        <div className="h-full flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`
                                                    text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all
                                                    ${isSameDay(cell.date, new Date()) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 group-hover:text-blue-600'}
                                                `}>
                                                    {cell.day}
                                                </span>
                                            </div>

                                            {/* Compact Event Indicators */}
                                            <div className="mt-1 space-y-1 overflow-hidden">
                                                {cell.events.slice(0, 3).map((evt, eIdx) => (
                                                    <div key={eIdx} className={`w-full h-1.5 rounded-full ${evt.type === 'job' ? 'bg-amber-400' :
                                                            evt.type === 'task' ? 'bg-emerald-400' :
                                                                evt.type === 'todo' ? 'bg-indigo-400' : 'bg-slate-300'
                                                        }`} title={evt.title} />
                                                ))}
                                                {cell.events.length > 3 && (
                                                    <div className="text-[8px] font-black text-slate-400 text-center uppercase">+ {cell.events.length - 3} More</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Details Panel */}
            <AnimatePresence>
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 340, opacity: 1 }}
                    className="bg-white border-l border-slate-200 h-full flex flex-col shadow-xl z-20"
                >
                    <div className="p-6 border-b border-slate-100 bg-slate-50/20">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Daily Agenda</h3>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">
                            {months[selectedDate.getMonth()]} {selectedDate.getDate()}
                        </h2>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-tight mt-0.5">
                            {daysOfWeek[selectedDate.getDay()]}, {selectedDate.getFullYear()}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase">Fetching Schedule...</p>
                            </div>
                        ) : getSelectedDayEvents().length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Clock className="text-slate-300" size={24} />
                                </div>
                                <h4 className="text-slate-900 font-black text-sm mb-1 uppercase tracking-tight">Open Slot</h4>
                                <p className="text-[11px] text-slate-500 font-medium">No deadlines or tasks synchronized for this day.</p>
                            </div>
                        ) : (
                            getSelectedDayEvents().map((evt) => (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 rounded-xl border-2 shadow-sm bg-white transition-all hover:shadow-md group ${evt.type === 'job' ? 'border-amber-100 hover:border-amber-300 bg-amber-50/10' :
                                            evt.type === 'task' ? 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/10' :
                                                evt.type === 'todo' ? 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/10' :
                                                    'border-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${evt.type === 'job' ? 'bg-amber-100 text-amber-600' :
                                                    evt.type === 'task' ? 'bg-emerald-100 text-emerald-600' :
                                                        evt.type === 'todo' ? 'bg-indigo-100 text-indigo-600' :
                                                            'bg-slate-100 text-slate-600'
                                                }`}>
                                                {getTypeIcon(evt.type)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evt.type}</span>
                                        </div>
                                        {evt.priority === 'High' && (
                                            <span className="flex items-center gap-1 text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-full border border-rose-100">
                                                <AlertCircle size={10} /> CRITICAL
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="font-black text-slate-900 text-sm mb-2 leading-snug group-hover:text-blue-600 transition-colors">{evt.title}</h4>

                                    <div className="grid grid-cols-1 gap-1.5 mt-3 pt-3 border-t border-slate-100/50">
                                        {Object.entries(evt.details).map(([key, value]) => (
                                            value && (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                                    <span className="text-[11px] font-bold text-slate-700 truncate">{value}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-xs hover:bg-white hover:border-blue-400 hover:text-blue-600 shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            Return to Today
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default EmployeeCalendar;
