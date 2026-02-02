import React, { createContext, useContext, useState, useEffect } from 'react';
import { getEmployees } from '../services/employeeApi';

const EmployeeViewContext = createContext();

export const useEmployeeView = () => {
    const context = useContext(EmployeeViewContext);
    if (!context) {
        throw new Error('useEmployeeView must be used within EmployeeViewProvider');
    }
    return context;
};

export const EmployeeViewProvider = ({ children, currentUser }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployeeId && employees.length > 0) {
            const employee = employees.find(e => e._id === selectedEmployeeId);
            setSelectedEmployee(employee || null);
        } else {
            setSelectedEmployee(null);
        }
    }, [selectedEmployeeId, employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await getEmployees();
            // Map validation to ensure we have the correct structure
            const mappedEmployees = data.map(emp => ({
                ...emp,
                name: emp.fullName || emp.name,
                role: emp.designation || emp.role
            }));
            setEmployees(mappedEmployees);

            // Auto-select logic
            if (!selectedEmployeeId && mappedEmployees.length > 0) {
                let defaultId = mappedEmployees[0]._id;

                // If currentUser is provided, try to find them in the list
                if (currentUser) {
                    const found = mappedEmployees.find(e =>
                        (e._id === currentUser._id) ||
                        (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase())
                    );
                    if (found) {
                        console.log('Auto-selecting logged-in user:', found.name);
                        defaultId = found._id;
                    }
                }

                setSelectedEmployeeId(defaultId);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        selectedEmployeeId,
        setSelectedEmployeeId,
        selectedEmployee,
        employees,
        loading,
        refreshEmployees: fetchEmployees
    };

    return (
        <EmployeeViewContext.Provider value={value}>
            {children}
        </EmployeeViewContext.Provider>
    );
};

export default EmployeeViewContext;
