import { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatCurrency';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import AIAlerts from '../components/AIAlerts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const [insightRes, plannerRes] = await Promise.all([
                    api.get(`/insights?month=${month}`),
                    api.get(`/planner`)
                ]);
                setInsights(insightRes.data);
                setPlanner(plannerRes.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [month]);

    if (loading) return <div className="animate-fade-in text-secondary">Loading your financial profile...</div>;
    if (!insights) return <div className="animate-fade-in text-danger">Failed to load data.</div>;

    const { totals, categoryBreakdown, budgetProgress, ai } = insights;

    // Formatting for Recharts
    const pieData = categoryBreakdown.map(c => ({
        name: c.category,
        value: c.amount
    }));

    const barData = budgetProgress.map(b => ({
        name: b.category_name,
        Spent: Number(b.spent),
        Limit: Number(b.limit_amount)
    }));

    return (
        <div className="animate-fade-in">
            <div className="page-title">
                <h1>Financial Dashboard</h1>
                <input
                    type="month"
                    className="input-field"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    style={{ margin: 0, padding: '0.5rem 1rem' }}
                />
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Balance</h3>
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
                            <DollarSign size={20} color="var(--primary)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {formatCurrency(Number(totals.balance))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Income</h3>
                        <div style={{ background: 'var(--success-bg)', padding: '0.5rem', borderRadius: '50%' }}>
                            <ArrowUpRight size={20} color="var(--success)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {formatCurrency(Number(totals.totalIncome))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Expenses</h3>
                        <div style={{ background: 'var(--danger-bg)', padding: '0.5rem', borderRadius: '50%' }}>
                            <ArrowDownRight size={20} color="var(--danger)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {formatCurrency(Number(totals.totalExpense))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-glass)', border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Financial Health</h3>
                        <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.5rem', borderRadius: '50%' }}>
                            <Target size={20} color="var(--accent)" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: ai?.healthScore > 75 ? 'var(--success)' : ai?.healthScore < 40 ? 'var(--danger)' : 'var(--warning)' }}>
                            {ai?.healthScore || 0}
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ 100</span>
                    </div>
                </div>
            </div>

            {/* AI section and Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Insights Panel */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <AIAlerts aiData={ai} />
                </div>

                {/* Pie Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} className="text-primary" /> Category Distribution
                    </h3>
                    {pieData.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No expenses recorded.
                        </div>
                    )}
                </div>

                {/* Bar Chart vs Budgets */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} className="text-secondary" /> Budget vs Actual
                    </h3>
                    {barData.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => `₹${value}`} stroke="#666" />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#666" />
                                    <RechartsTooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Spent" fill="var(--danger)" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="Limit" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', flexDir: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <p>No budgets active.</p>
                            <Link to="/planner" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Setup Strategy</Link>
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default Dashboard;