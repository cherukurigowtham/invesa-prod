import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Trim inputs to avoid whitespace errors
            const payload = {
                username: formData.username.trim(),
                password: formData.password.trim()
            };

            const response = await api.post('/login', payload);
            const user = response.data.user || {};
            const token = response.data.token;
            localStorage.setItem('user', JSON.stringify({ ...user, token }));
            window.dispatchEvent(new Event("storage")); // Update Navbar
            navigate('/', { replace: true });
        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.response?.data?.error || 'Login failed';
            setError(msg);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('user')) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <Button type="submit" className="w-full">Login</Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Don't have an account? <Link to="/register" className="text-primary hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
