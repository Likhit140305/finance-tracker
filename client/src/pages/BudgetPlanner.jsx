import { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatCurrency';
import { Target, PieChart, Info, Settings, FileText } from 'lucide-react';

const BudgetPlanner = () => {
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [salary, setSalary] = useState('');
    const [strategy, setStrategy] = useState('');
    const [goals, setGoals] = useState('');

    const loadPlanner = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/planner');
            if (data) {
                setPlanner(data);
                setSalary(data.salary);
                setStrategy(data.strategy_type);
                setGoals(data.goals || '');
            }
        } catch (err) {
            console.error("Failed to load planner info", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlanner();
    }, []);

    const calculateAllocations = (sal, strat) => {
        const val = Number(sal) || 0;
        if (strat === '70-10-10-10') {
            return [
                { category: 'Expenses', percentage: 70, amount: val * 0.7 },
                { category: 'Savings', percentage: 10, amount: val * 0.1 },
                { category: 'Fixed Deposits', percentage: 10, amount: val * 0.1 },
                { category: 'Investments', percentage: 10, amount: val * 0.1 }
            ];
        } else if (strat === '50-30-20') {
            return [
                { category: 'Needs', percentage: 50, amount: val * 0.5 },
                { category: 'Wants', percentage: 30, amount: val * 0.3 },
                { category: 'Savings & Investments', percentage: 20, amount: val * 0.2 }
            ];
        } else if (strat === 'custom') {
            return [
                { category: 'Living', percentage: 60, amount: val * 0.6 },
                { category: 'Fun', percentage: 20, amount: val * 0.2 },
                { category: 'Future', percentage: 20, amount: val * 0.2 }
            ];
        }
        return [];
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const allocations = calculateAllocations(salary, strategy);
            await api.post('/planner', { salary: Number(salary), strategy_type: strategy, goals, allocations });
            loadPlanner();
        } catch (err) {
            console.error("Failed to save planner", err);
            alert("Error saving budget plan.");
        }
    };

    if (loading) {
        return <div className="animate-fade-in">Loading budget planner...</div>;
    }

    const currentAllocations = calculateAllocations(salary, strategy);

    return (
        <div className="animate-fade-in">
            <div className="page-title">
                <h1>Intelligent Budget Planner</h1>
                {planner && <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18} /> Active Plan</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {/* Configuration Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Settings size={20} className="text-primary" /> Configuration
                    </h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Monthly Salary (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="input-field"
                                value={salary}
                                onChange={e => setSalary(e.target.value)}
                                placeholder="e.g. 5000"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Budgeting Strategy</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="strategy" value="70-10-10-10" checked={strategy === '70-10-10-10'} onChange={e => setStrategy(e.target.value)} required />
                                    <span><strong>70-10-10-10 Rule</strong> (Stable Setup)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="strategy" value="50-30-20" checked={strategy === '50-30-20'} onChange={e => setStrategy(e.target.value)} required />
                                    <span><strong>50-30-20 Rule</strong> (Flexible Setup)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="strategy" value="custom" checked={strategy === 'custom'} onChange={e => setStrategy(e.target.value)} required />
                                    <span><strong>Custom Plan</strong> (Advanced)</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                Financial Goals <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span>
                            </label>
                            <textarea
                                className="input-field"
                                rows="2"
                                value={goals}
                                onChange={e => setGoals(e.target.value)}
                                placeholder="E.g., Save ₹10K for a car"
                            />
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                            {planner ? 'Update Plan' : 'Save Monthly Plan'}
                        </button>
                    </form>
                </div>

                {/* Preview / Active Dashboard */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <PieChart size={20} className="text-secondary" /> Plan Breakdown
                    </h3>
                    
                    {!salary || !strategy ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Info size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Enter your salary and select a strategy to see the breakdown.</p>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Projected Allocation for Month</p>
                                <h2 style={{ color: 'var(--primary)', margin: 0 }}>{formatCurrency(Number(salary))}</h2>
                            </div>

                            {currentAllocations.map((alloc, idx) => (
                                <div key={idx} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', borderLeft: `4px solid hsl(${idx * 40 + 200}, 70%, 50%)` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{alloc.category}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{alloc.percentage}%</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                        {formatCurrency(alloc.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {planner && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }}/>
                        Not happy with your strategy? You can refine or reset it anytime above. Your budget usage will adapt automatically.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BudgetPlanner;