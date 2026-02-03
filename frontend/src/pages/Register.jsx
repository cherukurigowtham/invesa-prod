import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        bio: '',
        role: 'Entrepreneur'
    });
    const [error, setError] = useState('');
    const [strength, setStrength] = useState(0);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (strength < 3) {
            setError("Password is too weak. Please use at least 8 characters, ensuring a mix of letters, numbers, and symbols.");
            return;
        }
        try {
            await api.post('/register', formData);

            // Automatic login
            const loginResponse = await api.post('/login', {
                username: formData.username,
                password: formData.password
            });

            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            alert('Account created successfully!');
            navigate('/');
            window.location.reload(); // To update Navbar
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                    />
                    <Input
                        placeholder="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            // Simple strength calculation
                            let s = 0;
                            if (e.target.value.length >= 8) s++;
                            if (/[A-Z]/.test(e.target.value)) s++;
                            if (/[0-9]/.test(e.target.value)) s++;
                            if (/[^A-Za-z0-9]/.test(e.target.value)) s++;
                            setStrength(s);
                        }}
                        required
                    />
                    {formData.password && (
                        <div className="space-y-1">
                            <div className="flex h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${strength <= 1 ? 'bg-red-500 w-1/4' :
                                        strength === 2 ? 'bg-yellow-500 w-2/4' :
                                            strength === 3 ? 'bg-blue-500 w-3/4' :
                                                'bg-green-500 w-full'
                                        }`}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                                {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                            </p>
                        </div>
                    )}
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="Entrepreneur">Entrepreneur</option>
                        <option value="Investor">Investor</option>
                    </select>
                    <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                    <Button type="submit" className="w-full">Create Account</Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
