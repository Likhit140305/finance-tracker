import { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatCurrency';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Target, TrendingUp, PiggyBank, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import AIAlerts from '../components/AIAlerts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

// Allocation labels that represent broad spending (catch-all for expenses)
const CATCHALL_EXPENSE_LABELS = ['expenses', 'needs', 'wants', 'living'];

// Allocation labels that are savings/investment type — must NOT be counted in catch-all expense
const SAVINGS_TYPE_LABELS = ['savings', 'fixed deposit', 'investment', 'future'];

/**
 * Compute how much has been spent/saved for a given allocation bucket.
 *
 * - Savings/FD/Investment buckets: look up a real category by matching name.
 *   e.g. allocation "Fixed Deposits" → sum of all "Fixed Deposits" expense transactions.
 * - Expenses/Needs/Wants/Living: total expense MINUS anything already counted in savings-type categories.
 *
 * @param {string} allocCategory - name of allocation (e.g. "Fixed Deposits", "Expenses")
 * @param {object} totals        - { totalIncome, totalExpense }
 * @param {Array}  breakdown     - categoryBreakdown from insights: [{ category, amount }]
 */
function getAllocSpent(allocCategory, totals, breakdown) {
    const key = allocCategory.toLowerCase();

    // Check if this is a named savings/investment bucket
    const isSpecific = SAVINGS_TYPE_LABELS.some(l => key.includes(l));
    if (isSpecific) {
        // Sum all breakdown categories whose name fuzzy-matches this allocation
        return breakdown
            .filter(b => b.category.toLowerCase().includes(key) || key.includes(b.category.toLowerCase()))
            .reduce((sum, b) => sum + b.amount, 0);
    }

    // For catch-all expense buckets (Expenses, Needs, Wants, Living):
    // totalExpense minus savings-type category amounts (those have their own buckets)
    if (CATCHALL_EXPENSE_LABELS.some(l => key.includes(l))) {
        const savingsSpent = breakdown
            .filter(b => SAVINGS_TYPE_LABELS.some(l => b.category.toLowerCase().includes(l)))
            .reduce((sum, b) => sum + b.amount, 0);
        return Math.max(totals.totalExpense - savingsSpent, 0);
    }

    return 0;
}

const ALLOC_COLORS = [
    { bar: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: '#3b82f6' },
    { bar: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: '#10b981' },
    { bar: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: '#8b5cf6' },
    { bar: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: '#f59e0b' },
    { bar: '#ec4899', bg: 'rgba(236,72,153,0.08)',  border: '#ec4899' },
];

const Dashboard = () => {
    const [insights, setInsights] = useState(null);
    const [planner,  setPlanner]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [month,    setMonth]    = useState(new Date().toISOString().slice(0, 7));

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
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [month]);

    if (loading) return <div className="animate-fade-in text-secondary">Loading your financial profile...</div>;
    if (!insights) return <div className="animate-fade-in text-danger">Failed to load data.</div>;

    const { totals, categoryBreakdown, budgetProgress, ai } = insights;

    const pieData = categoryBreakdown.map(c => ({ name: c.category, value: c.amount }));
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

            {/* ── Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Balance</h3>
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '50%' }}>
                            <DollarSign size={20} color="var(--primary)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(totals.balance))}</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Income</h3>
                        <div style={{ background: 'var(--success-bg)', padding: '0.5rem', borderRadius: '50%' }}>
                            <ArrowUpRight size={20} color="var(--success)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(totals.totalIncome))}</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Expenses</h3>
                        <div style={{ background: 'var(--danger-bg)', padding: '0.5rem', borderRadius: '50%' }}>
                            <ArrowDownRight size={20} color="var(--danger)" />
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(Number(totals.totalExpense))}</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-glass)', border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Financial Health</h3>
                        <div style={{ background: 'rgba(139,92,246,0.15)', padding: '0.5rem', borderRadius: '50%' }}>
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

            {/* ── AI Alerts ── */}
            <div style={{ marginBottom: '2rem' }}>
                <AIAlerts aiData={ai} />
            </div>

            {/* ── Strategy Spending Breakdown ── */}
            {planner && planner.allocations?.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                                <TrendingUp size={20} color="var(--primary)" />
                                Strategy Spending —{' '}
                                <span style={{ color: 'var(--primary)' }}>{planner.strategy_type.toUpperCase()}</span>
                            </h3>
                            <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                Monthly salary: {formatCurrency(planner.salary)} &nbsp;·&nbsp; Tracking {month}
                            </p>
                        </div>
                        <Link to="/planner" className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                            Edit Plan
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {planner.allocations.map((alloc, idx) => {
                            const palette   = ALLOC_COLORS[idx % ALLOC_COLORS.length];
                            const limit     = Number(alloc.amount);
                            const spent     = getAllocSpent(alloc.category, totals, categoryBreakdown);
                            const remaining = Math.max(limit - spent, 0);
                            const overBy    = Math.max(spent - limit, 0);
                            const percent   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                            const isOver    = spent > limit;
                            const isWarning = !isOver && percent >= 80;
                            const barGrad   = isOver
                                ? 'linear-gradient(90deg,#ef4444,#ff6b6b)'
                                : isWarning
                                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                    : `linear-gradient(90deg,${palette.bar},${palette.bar}cc)`;
                            const isSavingType = SAVINGS_TYPE_LABELS.some(l => alloc.category.toLowerCase().includes(l));

                            return (
                                <div key={idx} style={{
                                    background: palette.bg,
                                    border: `1px solid ${palette.border}30`,
                                    borderRadius: '0.75rem',
                                    padding: '1.1rem 1.25rem',
                                }}>
                                    {/* Title row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: palette.bar, flexShrink: 0 }} />
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{alloc.category}</span>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                                            borderRadius: '999px', background: `${palette.bar}25`, color: palette.bar
                                        }}>
                                            {alloc.percentage}%
                                        </span>
                                        {isSavingType && (
                                            <PiggyBank size={14} color="var(--text-muted)" title="Savings tracker" />
                                        )}
                                    </div>

                                    {/* Spent / Limit */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {isSavingType ? 'Saved so far' : 'Spent so far'}
                                        </span>
                                        <span>
                                            <strong style={{ color: isOver ? '#ef4444' : 'var(--text-primary)' }}>{formatCurrency(spent)}</strong>
                                            <span style={{ color: 'var(--text-muted)' }}> / {formatCurrency(limit)}</span>
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.55rem' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${percent}%`,
                                            background: barGrad,
                                            borderRadius: '999px',
                                            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                                            boxShadow: `0 0 10px ${palette.bar}55`
                                        }} />
                                    </div>

                                    {/* Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{percent.toFixed(1)}% used</span>
                                        {isOver ? (
                                            <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <AlertTriangle size={11} /> Over by {formatCurrency(overBy)}
                                            </span>
                                        ) : remaining === 0 ? (
                                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Limit reached</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={11} color="var(--success)" /> {formatCurrency(remaining)} remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} className="text-primary" /> Category Distribution
                    </h3>
                    {pieData.length > 0 ? (
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
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
                                    <Bar dataKey="Limit"  fill="var(--primary)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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
