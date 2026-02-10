
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { Github, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        role: 'Entrepreneur',
        bio: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'username' && /\s/.test(value)) return;
        setFormData({ ...formData, [name]: value });
    };

    const validatePassword = (pwd) => {
        if (pwd.length < 8) return "Password must be at least 8 chars long";
        if (!/\d/.test(pwd)) return "Password must contain a number";
        if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain a special character";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const pwdError = validatePassword(formData.password);
        if (pwdError) {
            setError(pwdError);
            setIsLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/auth/signup', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                bio: formData.bio
            });

            // Auto-login after signup
            if (data.token) {
                localStorage.setItem('user', JSON.stringify({
                    ...data.user,
                    token: data.token
                }));
                window.dispatchEvent(new Event("storage"));
                navigate('/', { replace: true });
            } else {
                setSuccessMessage("Account created! Please log in.");
            }

        } catch (err) {
            console.error("Signup Error:", err);
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (successMessage) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <div className="p-8 rounded-lg border border-green-500 bg-green-500/10 text-center">
                    <h2 className="text-2xl font-bold text-green-500 mb-2">Success!</h2>
                    <p className="text-white">{successMessage}</p>
                    <Link to="/login" className="text-yellow-500 hover:underline mt-4 inline-block">Go to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center py-10 px-4" >
            <div className="w-full max-w-md p-6 rounded-lg border shadow-lg bg-card text-card-foreground">
                <h1 className="text-2xl font-bold mb-2 text-center text-yellow-500">Create Account</h1>
                <p className="text-sm text-gray-400 text-center mb-6">Join Invesa today</p>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                {/* Social Login Removed */}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        name="username"
                        placeholder="Username (no spaces)"
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
                    <div className="relative">
                        <Input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (Min 8, Upper, Special)"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            name="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-white focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={isLoading}
                        >
                            <option value="Entrepreneur" className="bg-black text-white">Entrepreneur</option>
                            <option value="Investor" className="bg-black text-white">Investor</option>
                        </select>
                    </div>

                    <textarea
                        name="bio"
                        placeholder="Short Bio (Optional)"
                        value={formData.bio}
                        onChange={handleChange}
                        className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm text-white focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-gray-500"
                        disabled={isLoading}
                    />

                    <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-yellow-500 hover:underline font-medium">Login</Link>
                </p>
            </div>
        </div >
    );
};

export default Register;
