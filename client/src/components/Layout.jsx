import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, List, PieChart, Layers, LogOut, Wallet } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '250px',
                height: '100vh',
                background: 'var(--bg-glass)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(12px)',
                zIndex: 50
            }}>
                <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                        <Wallet size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>FinanceTracker</h2>
                </div>

                <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Welcome back,
                    </div>
                    <div style={{ fontWeight: 500 }}>{user?.name}</div>
                </div>

                <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Home size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <PieChart size={20} /> Budget Planner
                    </NavLink>
                    <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <List size={20} /> Transactions
                    </NavLink>
                    <NavLink to="/budgets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <PieChart size={20} /> Budgets
                    </NavLink>
                    <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Layers size={20} /> Categories
                    </NavLink>
                </nav>

                <div style={{ padding: '1rem' }}>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="main-content">
                <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
