import { useState, useEffect } from 'react';
import api from '../api';
import { formatCurrency } from '../utils/formatCurrency';
import { List, Plus, Trash2, Calendar, FileText } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgetInsights, setBudgetInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [source, setSource] = useState('manual');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('receipt', file);

        setIsScanning(true);
        try {
            const { data } = await api.post('/planner/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.amount) setAmount(data.amount);
            if (data.date) setDate(data.date);
            if (data.merchant) setNote(data.merchant);
            setSource('ocr');

            // Auto-select category based on OCR suggestion
            // e.g. suggestedCategoryType = 'fuel', 'groceries', 'food' etc.
            if (data.suggestedCategoryType && categories.length > 0) {
                const suggested = data.suggestedCategoryType.toLowerCase();

                // Try exact name match first, then partial match
                const match =
                    categories.find(c => c.name.toLowerCase() === suggested) ||
                    categories.find(c => c.name.toLowerCase().includes(suggested)) ||
                    categories.find(c => suggested.includes(c.name.toLowerCase()));

                if (match) setCategoryId(match.category_id);
            }

        } catch (err) {
            console.error(err);
            alert('Failed to scan receipt');
        } finally {
            setIsScanning(false);
            e.target.value = null;
            alert('Receipt scanned successfully! Please review the details in the form and click "Add Transaction" to save it.');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [txRes, catRes, insightRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/categories'),
                    api.get(`/insights?month=${new Date().toISOString().slice(0, 7)}`)
                ]);
                setTransactions(txRes.data);
                setCategories(catRes.data);
                setBudgetInsights(insightRes.data.budgetProgress || []);
                if (catRes.data.length > 0) {
                    const firstExpense = catRes.data.find(c => c.type === 'expense');
                    const firstIncome = catRes.data.find(c => c.type === 'income');
                    setCategoryId((firstExpense || firstIncome || catRes.data[0]).category_id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchTransactions = async () => {
        try {
            const [txRes, insightRes] = await Promise.all([
                api.get('/transactions'),
                api.get(`/insights?month=${new Date().toISOString().slice(0, 7)}`)
            ]);
            setTransactions(txRes.data);
            setBudgetInsights(insightRes.data.budgetProgress || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/transactions', { categoryId, amount, date, note, source });
            if (res.data?.warning) {
                alert(res.data.warning);
            }
            setAmount('');
            setNote('');
            setSource('manual');
            setDate(new Date().toISOString().slice(0, 10));
            fetchTransactions();
        } catch (err) {
            console.error(err);
            alert('Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading transactions...</div>;

    const expenseCats = categories.filter(c => c.type === 'expense');
    const incomeCats = categories.filter(c => c.type === 'income');

    return (
        <div className="animate-fade-in">
            <div className="page-title">
                <h1><List size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }} /> Transactions</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} className="text-primary" /> Add Transaction
                        </h3>
                        <div>
                            <input
                                type="file"
                                id="receipt-upload"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleScan}
                                disabled={isScanning}
                            />
                            <label htmlFor="receipt-upload" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer', opacity: isScanning ? 0.7 : 1 }}>
                                <FileText size={16} style={{ marginRight: '0.4rem', display: 'inline' }} />
                                {isScanning ? 'Scanning...' : 'Scan Receipt'}
                            </label>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="input-field"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                                placeholder="0.00"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Category</label>
                            <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                {categories.length === 0 && <option value="">No categories available</option>}
                                {expenseCats.length > 0 && (
                                    <optgroup label="Expenses">
                                        {expenseCats.map(c => (
                                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {incomeCats.length > 0 && (
                                    <optgroup label="Income">
                                        {incomeCats.map(c => (
                                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Note (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="e.g. Weekly groceries"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={isSubmitting || categories.length === 0}
                        >
                            {categories.length === 0
                                ? 'Create a category first'
                                : isSubmitting ? 'Saving...' : 'Add Transaction'}
                        </button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0 }}>Recent Transactions</h3>
                    </div>

                    {transactions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No transactions found. Add your first transaction!
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Date</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Category</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Note</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.txn_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={14} />
                                                    {/* Show date in local format, not raw ISO */}
                                                    {new Date(t.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span className={`badge ${t.category_type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                                    {t.category_name || 'Uncategorized'}
                                                </span>
                                                {(() => {
                                                    // Only show budget progress if this transaction happened in the current month
                                                    // This prevents confusion for older transactions having current month's limits shown
                                                    const currentMonth = new Date().toISOString().slice(0, 7);
                                                    if (!t.date.startsWith(currentMonth)) return null;

                                                    const b = budgetInsights?.find(b => b.category_id === t.category_id);
                                                    if (b) {
                                                        const spent = Number(b.spent);
                                                        const limit = Number(b.limit_amount);
                                                        const percent = Math.min((spent / limit) * 100, 100);
                                                        const isWarning = percent > 85;
                                                        const isDanger = percent >= 100;

                                                        let barColor = 'var(--primary)';
                                                        if (isDanger) barColor = 'var(--danger)';
                                                        else if (isWarning) barColor = 'var(--warning)';

                                                        return (
                                                            <div style={{ marginTop: '0.4rem', width: '100px' }}>
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                                                                    Remaining: ₹{Math.max(limit - spent, 0)}
                                                                </div>
                                                                <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: barColor, transition: 'width 0.5s ease-out' }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                                                {t.note || '-'}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: t.category_type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                                {t.category_type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(t.txn_id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;