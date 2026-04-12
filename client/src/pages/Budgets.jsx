import { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatCurrency';
import { PieChart, Plus, Trash2, Calendar } from 'lucide-react';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [categoryId, setCategoryId] = useState('');
    const [limitAmount, setLimitAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [month]); // Reload budgets when month changes

    const loadData = async () => {
        setLoading(true);
        try {
            const [bRes, cRes] = await Promise.all([
                api.get(`/budgets?month=${month}`),
                api.get('/categories')
            ]);
            setBudgets(bRes.data);
            
            const expenseCategories = cRes.data.filter(c => c.type === 'expense');
            setCategories(expenseCategories);
            if (expenseCategories.length > 0) {
                setCategoryId(expenseCategories[0].category_id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBudgets = async () => {
        try {
            const { data } = await api.get(`/budgets?month=${month}`);
            setBudgets(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/budgets', { categoryId, limitAmount, month });
            setLimitAmount('');
            fetchBudgets();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this budget limit?')) return;
        try {
            await api.delete(`/budgets/${id}`);
            fetchBudgets();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-title">
                <h1><PieChart size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }} /> Monthly Budgets</h1>
                <input 
                    type="month" 
                    className="input-field" 
                    value={month} 
                    onChange={e => setMonth(e.target.value)} 
                    style={{ margin: 0, padding: '0.5rem 1rem' }} 
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} className="text-primary"/> Set Budget Limit
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Category</label>
                            <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                {categories.length === 0 && <option value="">No expense categories found</option>}
                                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Monthly Limit (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="1"
                                className="input-field" 
                                value={limitAmount} 
                                onChange={e => setLimitAmount(e.target.value)} 
                                required 
                                placeholder="e.g. 500.00"
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting || categories.length === 0}>
                            {categories.length === 0 ? 'Create an expense category first' : (isSubmitting ? 'Saving...' : 'Set Limit')}
                        </button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Current Budget Limits</h3>
                    
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
                    ) : budgets.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No budgets set for {month}.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {budgets.map(b => (
                                <div key={b.budget_id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                                    <button 
                                        className="btn-icon" 
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', padding: '0.25rem' }} 
                                        onClick={() => handleDelete(b.budget_id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{b.category_name}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                                        {formatCurrency(Number(b.limit_amount))}
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>/mo</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Budgets;