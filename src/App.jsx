import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, deleteDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from 'recharts';

// --- Helper Functions & Constants ---

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const ICONS = {
    Dashboard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    Calendar: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" v2="6"></line><line x1="8" y1="2" v2="6"></line><line x1="3" y1="10" v2="10"></line></svg>,
    Transactions: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="m19 12-7 7-7-7"/></svg>,
    Tools: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>,
    AI: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-2 4 2 4 2-4-2-4z"/><path d="M20 12c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8z"/></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.4l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.4l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    Sun: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
    Moon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
    Laptop: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.7 20H3.3a1 1 0 0 1-.58-1.45L4 16"/></svg>,
    Trash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
    Edit: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
    Plus: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
};

const EXPENSE_CATEGORIES = ["Housing", "Transportation", "Food", "Utilities", "Insurance", "Healthcare", "Savings", "Personal", "Entertainment", "Debt", "Miscellaneous"];
const INCOME_CATEGORIES = ["Wages | Salary", "Bonus", "Commissions", "Overtime Pay", "Side Hustle", "Investments", "Retirement", "Other"];
const RECURRING_INCOME_SCHEDULES = ["Weekly", "Bi-Weekly", "Monthly", "Annually"];


// --- Firebase Setup ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Components ---

const DisclaimerModal = ({ onAccept }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Disclaimer</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    This application is a financial tool and does not provide professional financial advice. The information and calculations provided are for informational purposes only.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You should consult with a professional financial advisor, accountant, or other qualified professional before making any financial decisions.
                </p>
                <button
                    onClick={onAccept}
                    className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                    I Understand and Accept
                </button>
            </div>
        </div>
    );
};

const Dashboard = ({ transactions, setView, userId }) => {
    const summary = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyData = transactions.reduce((acc, t) => {
            const date = new Date(t.date);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const key = `${month} ${year}`;
            
            if (!acc[key]) {
                acc[key] = { name: key, income: 0, expenses: 0 };
            }
            if (t.type === 'income') acc[key].income += t.amount;
            else acc[key].expenses += t.amount;
            
            return acc;
        }, {});

        const sortedMonthlyData = Object.values(monthlyData).sort((a,b) => new Date(a.name) - new Date(b.name));

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netBalance = totalIncome - totalExpenses;

        const expenseBreakdown = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const expensePieData = Object.entries(expenseBreakdown).map(([name, value]) => ({ name, value }));
        
        return { totalIncome, totalExpenses, netBalance, monthlyData: sortedMonthlyData, expensePieData };
    }, [transactions]);
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
                    <p className="text-3xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                    <p className="text-3xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
                    <p className={`text-3xl font-semibold ${summary.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{formatCurrency(summary.netBalance)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={summary.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                            <XAxis dataKey="name" className="text-xs fill-gray-500 dark:fill-gray-400" />
                            <YAxis tickFormatter={formatCurrency} className="text-xs fill-gray-500 dark:fill-gray-400" />
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{
                                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                    borderColor: '#4B5563',
                                    color: '#F9FAFB',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="income" fill="#10B981" name="Income" />
                            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={summary.expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}>
                                {summary.expensePieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                contentStyle={{
                                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                    borderColor: '#4B5563',
                                    color: '#F9FAFB',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Your User ID (for sharing/collaboration): <span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">{userId}</span></p>
            </div>
        </div>
    );
};

const Calendar = ({ transactions }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startingBalance, setStartingBalance] = useState(1000);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [projectionMonths, setProjectionMonths] = useState(3);

    const balanceHistory = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date();
        end.setMonth(end.getMonth() + parseInt(projectionMonths, 10));

        const history = [];
        let currentBalance = parseFloat(startingBalance) || 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recurringTransactions = transactions.filter(t => t.recurring);
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        const historicalDeltas = new Map();
        sortedTransactions
            .filter(t => {
                const tDate = new Date(t.date);
                tDate.setHours(0,0,0,0);
                return tDate >= start && tDate <= today;
            })
            .forEach(t => {
                const dateKey = new Date(t.date).toDateString();
                const delta = t.type === 'income' ? t.amount : -t.amount;
                historicalDeltas.set(dateKey, (historicalDeltas.get(dateKey) || 0) + delta);
            });

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const d_no_time = new Date(d);
            d_no_time.setHours(0, 0, 0, 0);
            const dateKey = d_no_time.toDateString();
            
            let dailyChange = 0;
            
            if (d_no_time <= today) {
                dailyChange = historicalDeltas.get(dateKey) || 0;
            } else {
                recurringTransactions.forEach(t => {
                    const origDate = new Date(t.date);
                    origDate.setHours(0, 0, 0, 0);
                    let isRecurringToday = false;

                    if (t.type === 'expense' && t.recurring.dueDate) {
                        if (d_no_time.getDate() === t.recurring.dueDate) {
                            isRecurringToday = true;
                        }
                    } else if (t.type === 'income' && t.recurring.schedule) {
                        const diffDays = Math.round((d_no_time - origDate) / (1000 * 60 * 60 * 24));
                        switch (t.recurring.schedule) {
                            case 'Weekly':
                                if (diffDays >= 0 && diffDays % 7 === 0) isRecurringToday = true;
                                break;
                            case 'Bi-Weekly':
                                if (diffDays >= 0 && diffDays % 14 === 0) isRecurringToday = true;
                                break;
                            case 'Monthly':
                                if (d_no_time.getDate() === origDate.getDate()) isRecurringToday = true;
                                break;
                            case 'Annually':
                                if (d_no_time.getDate() === origDate.getDate() && d_no_time.getMonth() === origDate.getMonth()) isRecurringToday = true;
                                break;
                        }
                    }

                    if (isRecurringToday) {
                        dailyChange += (t.type === 'income' ? t.amount : -t.amount);
                    }
                });
            }
            
            currentBalance += dailyChange;
            
            history.push({
                date: d_no_time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                balance: currentBalance,
            });
        }
        return history;
    }, [transactions, startingBalance, startDate, projectionMonths]);

    const transactionsByDate = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const dateKey = new Date(t.date).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(t);
            return acc;
        }, {});
    }, [transactions]);

    const selectedDayTransactions = transactionsByDate[selectedDate.toDateString()] || [];

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&lt;</button>
            <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&gt;</button>
        </div>
    );

    const renderDays = () => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 text-center"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = date.toDateString();
            const dayTransactions = transactionsByDate[dateKey] || [];
            const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const isSelected = selectedDate.toDateString() === date.toDateString();

            days.push(
                <div key={day} onClick={() => setSelectedDate(date)} className={`p-2 text-center border rounded-lg cursor-pointer ${isSelected ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <div>{day}</div>
                    {income > 0 && <div className="text-xs text-green-500">+{formatCurrency(income)}</div>}
                    {expense > 0 && <div className="text-xs text-red-500">-{formatCurrency(expense)}</div>}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Balance Tracker & Projection</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Starting Balance</label>
                        <input type="number" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Future Projection</label>
                        <select value={projectionMonths} onChange={e => setProjectionMonths(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="1">1 Month</option>
                            <option value="3">3 Months</option>
                            <option value="6">6 Months</option>
                            <option value="12">1 Year</option>
                        </select>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={balanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                        <XAxis dataKey="date" className="text-xs fill-gray-500 dark:fill-gray-400" />
                        <YAxis tickFormatter={formatCurrency} className="text-xs fill-gray-500 dark:fill-gray-400" domain={['auto', 'auto']} />
                        <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                borderColor: '#4B5563',
                                color: '#F9FAFB',
                                borderRadius: '0.5rem'
                            }}
                        />
                        <Legend />
                        <ReferenceLine x={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} stroke="red" strokeDasharray="3 3" label="Today" />
                        <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} dot={false} name="Account Balance" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    {renderHeader()}
                    <div className="grid grid-cols-7 gap-2 text-xs text-center font-bold text-gray-500 dark:text-gray-400">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mt-2">{renderDays()}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Transactions for {selectedDate.toLocaleDateString()}</h3>
                    {selectedDayTransactions.length > 0 ? (
                        <ul className="space-y-3">
                            {selectedDayTransactions.map((t, i) => (
                                <li key={i} className={`flex justify-between items-center p-3 rounded-lg ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{t.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.category}</p>
                                    </div>
                                    <p className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No transactions for this day.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionForm = ({ onAdd, onUpdate, transactionToEdit, setTransactionToEdit, userId }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringSchedule, setRecurringSchedule] = useState('');
    const [recurringDueDate, setRecurringDueDate] = useState(1);

    useEffect(() => {
        if (transactionToEdit) {
            setDescription(transactionToEdit.description);
            setAmount(transactionToEdit.amount);
            setDate(new Date(transactionToEdit.date).toISOString().slice(0, 10));
            setType(transactionToEdit.type);
            setCategory(transactionToEdit.category);
            setIsRecurring(!!transactionToEdit.recurring);
            if (transactionToEdit.recurring) {
                if (transactionToEdit.type === 'income') {
                    setRecurringSchedule(transactionToEdit.recurring.schedule);
                } else {
                    setRecurringDueDate(transactionToEdit.recurring.dueDate);
                }
            }
        } else {
            resetForm();
        }
    }, [transactionToEdit]);

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().slice(0, 10));
        setType('expense');
        setCategory(EXPENSE_CATEGORIES[0]);
        setIsRecurring(false);
        setRecurringSchedule('');
        setRecurringDueDate(1);
        setTransactionToEdit(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount) return;

        const transactionData = {
            description,
            amount: parseFloat(amount),
            date,
            type,
            category,
            userId,
            recurring: isRecurring ? {
                schedule: type === 'income' ? recurringSchedule : null,
                dueDate: type === 'expense' ? recurringDueDate : null,
            } : null,
        };

        if (transactionToEdit) {
            onUpdate(transactionToEdit.id, transactionData);
        } else {
            onAdd(transactionData);
        }
        resetForm();
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    };
    
    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{transactionToEdit ? 'Edit' : 'Add'} Transaction</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="flex space-x-4 mt-1">
                    <button type="button" onClick={() => handleTypeChange('expense')} className={classNames('w-full py-2 rounded-md', type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600')}>Expense</button>
                    <button type="button" onClick={() => handleTypeChange('income')} className={classNames('w-full py-2 rounded-md', type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600')}>Income</button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="flex items-center">
                <input id="recurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Recurring Transaction</label>
            </div>
            {isRecurring && (
                type === 'income' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>
                        <select value={recurringSchedule} onChange={(e) => setRecurringSchedule(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Select Schedule</option>
                            {RECURRING_INCOME_SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Day of Month (1-28)</label>
                        <input type="number" min="1" max="28" value={recurringDueDate} onChange={(e) => setRecurringDueDate(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                )
            )}
            <div className="flex justify-end space-x-3">
                {transactionToEdit && <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500">Cancel Edit</button>}
                <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{transactionToEdit ? 'Update' : 'Add'} Transaction</button>
            </div>
        </form>
    );
};

const Transactions = ({ transactions, onAdd, onUpdate, onDelete, userId }) => {
    const [transactionToEdit, setTransactionToEdit] = useState(null);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Transactions</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <TransactionForm 
                        onAdd={onAdd}
                        onUpdate={onUpdate}
                        transactionToEdit={transactionToEdit}
                        setTransactionToEdit={setTransactionToEdit}
                        userId={userId}
                    />
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>
                    <ul className="space-y-3 max-h-[600px] overflow-y-auto">
                        {transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                            <li key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{t.description}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()} - {t.category}</p>
                                </div>
                                <p className={`font-semibold w-32 text-right ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button onClick={() => setTransactionToEdit(t)} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit className="w-5 h-5" /></button>
                                    <button onClick={() => onDelete(t.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"><Trash className="w-5 h-5" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Tools = () => {
    const [activeTool, setActiveTool] = useState('mortgage');

    const MortgageCalculator = () => {
        const [principal, setPrincipal] = useState(250000);
        const [interestRate, setInterestRate] = useState(6.5);
        const [loanTerm, setLoanTerm] = useState(30);
        const [extraPayment, setExtraPayment] = useState(0);
        const [amortization, setAmortization] = useState(null);

        const calculate = () => {
            const P = parseFloat(principal);
            const r = parseFloat(interestRate) / 100 / 12;
            const n = parseFloat(loanTerm) * 12;
            const M_extra = parseFloat(extraPayment) || 0;

            if (P > 0 && r > 0 && n > 0) {
                const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                
                let schedule = [];
                let balance = P;
                let totalInterest = 0;
                let months = 0;
                while (balance > 0) {
                    months++;
                    let interestPayment = balance * r;
                    let principalPayment = M + M_extra - interestPayment;
                    if (balance < M + M_extra - interestPayment) {
                        principalPayment = balance + interestPayment - M_extra;
                         if (balance < M + M_extra) {
                            principalPayment = balance;
                            balance = 0;
                        } else {
                            balance -= principalPayment;
                        }
                    } else {
                         balance -= principalPayment;
                    }
                    totalInterest += interestPayment;
                    schedule.push({ month: months, interest: interestPayment, principal: principalPayment, balance: Math.max(0, balance) });
                }
                setAmortization({ monthlyPayment: M, schedule, totalInterest, totalMonths: months });
            }
        };

        useEffect(calculate, [principal, interestRate, loanTerm, extraPayment]);

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount ($)</label>
                        <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate (%)</label>
                        <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loan Term (Years)</label>
                        <input type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Extra Monthly Payment ($)</label>
                        <input type="number" value={extraPayment} onChange={e => setExtraPayment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                </div>
                {amortization && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Payment</h4>
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(amortization.monthlyPayment)}</p>
                            </div>
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Interest</h4>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(amortization.totalInterest)}</p>
                            </div>
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payoff Time</h4>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.floor(amortization.totalMonths / 12)}y {amortization.totalMonths % 12}m</p>
                            </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Principal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {amortization.schedule.map(row => (
                                        <tr key={row.month}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{row.month}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{formatCurrency(row.principal)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{formatCurrency(row.interest)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    // Car Payment Calculator would be very similar to Mortgage Calculator
    const CarPaymentCalculator = () => <MortgageCalculator />;


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Financial Tools</h1>
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button onClick={() => setActiveTool('mortgage')} className={`px-4 py-2 text-sm font-medium ${activeTool === 'mortgage' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Mortgage Calculator</button>
                <button onClick={() => setActiveTool('car')} className={`px-4 py-2 text-sm font-medium ${activeTool === 'car' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Car Payment Calculator</button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                {activeTool === 'mortgage' && <MortgageCalculator />}
                {activeTool === 'car' && <CarPaymentCalculator />}
            </div>
        </div>
    );
};

const FinancialAI = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatHistory = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            chatHistory.push({ role: "user", parts: [{ text: `As a financial assistant, answer this question: ${input}` }] });

            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            
            let botResponse = "Sorry, I couldn't generate a response.";
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
              botResponse = result.candidates[0].content.parts[0].text;
            }

            setMessages(prev => [...prev, { role: 'model', text: botResponse }]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'There was an error processing your request. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Financial Assistant</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ask for financial help, tips, or explanations. Remember, this is not professional advice.</p>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a financial question..."
                            className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Settings = ({ theme, setTheme }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Select your preferred theme.</p>
                <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                    <button onClick={() => setTheme('light')} className={`w-full flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-medium ${theme === 'light' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>
                        <ICONS.Sun className="w-5 h-5" />
                        <span>Light</span>
                    </button>
                    <button onClick={() => setTheme('dark')} className={`w-full flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-medium ${theme === 'dark' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>
                        <ICONS.Moon className="w-5 h-5" />
                        <span>Dark</span>
                    </button>
                    <button onClick={() => setTheme('system')} className={`w-full flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-medium ${theme === 'system' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>
                        <ICONS.Laptop className="w-5 h-5" />
                        <span>System</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    const [view, setView] = useState('dashboard');
    const [theme, setTheme] = useState('system');
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [transactions, setTransactions] = useState([]);

    // Theme Management
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'system';
        setTheme(storedTheme);
    }, []);

    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                if (mediaQuery.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            handleChange(); // Initial check
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Disclaimer
    useEffect(() => {
        const accepted = localStorage.getItem('disclaimerAccepted');
        if (accepted) {
            setShowDisclaimer(false);
        }
    }, []);

    const handleAcceptDisclaimer = () => {
        localStorage.setItem('disclaimerAccepted', 'true');
        setShowDisclaimer(false);
    };

    // Firebase Auth & Data
    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase sign-in error:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady || !userId) return;

        const transactionsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        const q = query(transactionsCollection);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = [];
            querySnapshot.forEach((doc) => {
                transactionsData.push({ id: doc.id, ...doc.data() });
            });
            setTransactions(transactionsData);
        }, (error) => {
            console.error("Error fetching transactions:", error);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId]);
    
    // Firestore CRUD operations
    const addTransaction = async (transactionData) => {
        try {
            const transactionsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
            await addDoc(transactionsCollection, transactionData);
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    };
    
    const updateTransaction = async (id, transactionData) => {
        try {
            const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id);
            await updateDoc(transactionDoc, transactionData);
        } catch (error) {
            console.error("Error updating transaction:", error);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id);
            await deleteDoc(transactionDoc);
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };


    const navigation = [
        { name: 'Dashboard', icon: ICONS.Dashboard, view: 'dashboard' },
        { name: 'Calendar', icon: ICONS.Calendar, view: 'calendar' },
        { name: 'Transactions', icon: ICONS.Transactions, view: 'transactions' },
        { name: 'Tools', icon: ICONS.Tools, view: 'tools' },
        { name: 'AI Assistant', icon: ICONS.AI, view: 'ai' },
    ];

    const renderView = () => {
        if (!isAuthReady) {
            return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>;
        }
        switch (view) {
            case 'dashboard': return <Dashboard transactions={transactions} setView={setView} userId={userId} />;
            case 'calendar': return <Calendar transactions={transactions} />;
            case 'transactions': return <Transactions transactions={transactions} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} userId={userId} />;
            case 'tools': return <Tools />;
            case 'ai': return <FinancialAI />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} />;
            default: return <Dashboard transactions={transactions} setView={setView} userId={userId} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}
            <div className="flex">
                <nav className="w-64 bg-white dark:bg-gray-800 p-4 flex flex-col h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-10">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span className="text-xl font-bold">FinTrack AI</span>
                    </div>
                    <ul className="flex-1 space-y-2">
                        {navigation.map((item) => (
                            <li key={item.name}>
                                <button
                                    onClick={() => setView(item.view)}
                                    className={classNames(
                                        'w-full flex items-center space-x-3 p-2 rounded-md text-sm font-medium',
                                        view === item.view
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    )}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span>{item.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div>
                         <button
                            onClick={() => setView('settings')}
                            className={classNames(
                                'w-full flex items-center space-x-3 p-2 rounded-md text-sm font-medium',
                                view === 'settings'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                        >
                            <ICONS.Settings className="w-6 h-6" />
                            <span>Settings</span>
                        </button>
                    </div>
                </nav>

                <main className="flex-1 h-screen overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}
