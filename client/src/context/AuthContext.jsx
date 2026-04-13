import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function getTokenExpiry(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            const token      = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (!token || !storedUser) { setLoading(false); return; }

            const expiry = getTokenExpiry(token);
            if (expiry && Date.now() > expiry) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                setUser(data);
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, []);

    // Step 1 of login/register — returns { requiresOTP: true, email, purpose } on success
    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        return data; // does NOT set user yet — waits for OTP
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        return data; // does NOT set user yet — waits for OTP
    };

    // Step 2 — verify OTP, receive JWT, set user session
    const verifyOtp = async (email, code, purpose) => {
        const { data } = await api.post('/auth/verify-otp', { email, code, purpose });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const resendOtp = async (email, purpose) => {
        const { data } = await api.post('/auth/resend-otp', { email, purpose });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
