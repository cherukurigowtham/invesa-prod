import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'Entrepreneur',
        bio: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/register', {
                ...formData,
                username: formData.username.toLowerCase()
            });
            // Redirect to login page with success state if possible, or just navigate
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Username or Email might be taken.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-md p-6 rounded-lg border shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-2 text-center text-invesa-gold">Create Account</h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    Join Invesa today
                </p>

                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="full_name"
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={isLoading}
                    />
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={isLoading}
                        >
                            <option value="Entrepreneur">Entrepreneur</option>
                            <option value="Investor">Investor</option>
                        </select>
                    </div>

                    <textarea
                        name="bio"
                        placeholder="Short Bio (Optional)"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isLoading}
                    />

                    <Button type="submit" className="w-full bg-invesa-gold hover:bg-invesa-gold/90 text-black font-semibold" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-invesa-gold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
