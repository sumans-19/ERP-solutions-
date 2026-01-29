import React, { useState, useEffect } from 'react';
import { getCalendarEvents } from '../../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Package, Briefcase, Users, FileText, ChevronDown, ChevronUp, ClipboardList, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [calendarGrid, setCalendarGrid] = useState([]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    useEffect(() => {
        fetchEvents();
        // Pre-select today on initial load
        setSelectedDate(new Date());
    }, [currentDate]);

    useEffect(() => {
        generateCalendarGrid();
    }, [currentDate, events]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            // Fetch 2 months buffer to handle edge days
            const start = new Date(year, month - 1, 1).toISOString();
            const end = new Date(year, month + 2, 0).toISOString();
            const data = await getCalendarEvents(start, end);
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateKey = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const generateCalendarGrid = () => {
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
                hasEvents: dayEvents.length > 0,
                events: dayEvents
            });
        }

        // Next month filler
        while (grid.length % 7 !== 0) {
            grid.push({ day: '', isCurrentMonth: false });
        }

        setCalendarGrid(grid);
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return formatDateKey(d1) === formatDateKey(d2);
    };

    const getSelectedDayEvents = () => {
        if (!selectedDate) return [];
        const dateStr = formatDateKey(selectedDate);
        return events.filter(e => e.date && formatDateKey(e.date) === dateStr);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'order': return <Package size={18} className="text-blue-500" />;
            case 'job': return <Briefcase size={18} className="text-amber-500" />;
            case 'task': return <CheckCircle size={18} className="text-emerald-500" />;
            case 'todo': return <ClipboardList size={18} className="text-indigo-500" />;
            case 'inventory': return <ShieldAlert size={18} className="text-rose-500" />;
            case 'grn_expiry': return <ShieldAlert size={18} className="text-rose-600" />;
            case 'followup': return <Users size={18} className="text-purple-500" />;
            default: return <FileText size={18} className="text-slate-400" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'order': return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'job': return 'bg-amber-50 border-amber-200 text-amber-800';
            case 'task': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
            case 'todo': return 'bg-indigo-50 border-indigo-200 text-indigo-800';
            case 'inventory':
            case 'grn_expiry': return 'bg-rose-50 border-rose-200 text-rose-800';
            case 'followup': return 'bg-purple-50 border-purple-200 text-purple-800';
            default: return 'bg-slate-50 border-slate-200 text-slate-800';
        }
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Main Calendar View */}
            <div className="flex-1 flex flex-col h-full p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="text-blue-600" />
                            Production Calendar
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage schedules, deadlines, and events</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-md shadow-sm border border-slate-200">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
                            <ChevronLeft className="text-slate-600" />
                        </button>
                        <div className="text-lg font-bold text-slate-800 w-48 text-center select-none">
                            {months[currentDate.getMonth()]} <span className="text-slate-400">{currentDate.getFullYear()}</span>
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
                            <ChevronRight className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                        {daysOfWeek.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {calendarGrid.map((cell, idx) => (
                            <div
                                key={idx}
                                onClick={() => cell.isCurrentMonth && setSelectedDate(cell.date)}
                                className={`
                            border-b border-r border-slate-100 p-2 relative transition-all cursor-pointer min-h-[100px] flex flex-col items-center justify-start pt-4 group
                            ${!cell.isCurrentMonth ? 'bg-slate-50/50' : 'hover:bg-blue-50/10'}
                            ${isSameDay(cell.date, selectedDate) ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : ''}
                        `}
                            >
                                {cell.isCurrentMonth && (
                                    <>
                                        <span className={`
                                    text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full mb-1 transition-all
                                    ${isSameDay(cell.date, new Date()) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 group-hover:bg-slate-100'}
                                `}>
                                            {cell.day}
                                        </span>

                                        {/* Event Count Indicator */}
                                        {cell.events && cell.events.length > 0 && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    {cell.events.length} Events
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Details Sidebar */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="w-96 bg-white border-l border-slate-200 shadow-sm h-full flex flex-col z-20"
                    >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">
                                {months[selectedDate.getMonth()]} {selectedDate.getDate()}
                            </h2>
                            <p className="text-slate-500 font-medium">{daysOfWeek[selectedDate.getDay()]}, {selectedDate.getFullYear()}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {getSelectedDayEvents().length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="text-slate-400 opacity-50" size={32} />
                                    </div>
                                    <h3 className="text-slate-900 font-bold mb-1">No Events</h3>
                                    <p className="text-slate-500 text-sm">Nothing scheduled for this day.</p>
                                </div>
                            ) : (
                                getSelectedDayEvents().map((evt) => (
                                    <motion.div
                                        key={evt.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-md border-l-4 shadow-sm bg-white ${evt.type === 'order' ? 'border-l-blue-500' :
                                            evt.type === 'job' ? 'border-l-amber-500' :
                                                evt.type === 'task' ? 'border-l-emerald-500' :
                                                    evt.type === 'todo' ? 'border-l-indigo-500' :
                                                        (evt.type === 'inventory' || evt.type === 'grn_expiry') ? 'border-l-rose-500' :
                                                            'border-l-purple-500'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(evt.type)}
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{evt.type}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${evt.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {evt.priority}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm mb-1">{evt.title}</h3>
                                        <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
                                            {Object.entries(evt.details).map(([key, value]) => (
                                                <div key={key} className="flex justify-between text-xs">
                                                    <span className="text-slate-500 capitalize">{key}:</span>
                                                    <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="w-full py-2 bg-white border border-slate-300 rounded-md text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Close Panel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarPage;

