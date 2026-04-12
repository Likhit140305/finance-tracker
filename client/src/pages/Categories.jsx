import { useState, useEffect } from 'react';
import api from '../api';
import { Layers, Plus, Trash2, Edit2 } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, { name, type });
            } else {
                await api.post('/categories', { name, type });
            }
            // Reset form
            setName('');
            setType('expense');
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.category_id);
        setName(category.name);
        setType(category.type);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will affect your transactions!')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && categories.length === 0) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in">
            <div className="page-title">
                <h1><Layers size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }} /> Category Management</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Category Name</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                                placeholder="e.g. Groceries"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Type</label>
                            <select className="input-field" value={type} onChange={e => setType(e.target.value)} required>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add Category')}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setName(''); setType('expense'); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Your Categories</h3>
                    
                    {categories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No categories found. Start by creating one!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {categories.map(cat => (
                                <div key={cat.category_id} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontWeight: 500, fontSize: '1.125rem' }}>{cat.name}</div>
                                        <span className={`badge ${cat.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                            {cat.type}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-icon" onClick={() => handleEdit(cat)}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(cat.category_id)}>
                                            <Trash2 size={18} />
                                        </button>
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

export default Categories;
