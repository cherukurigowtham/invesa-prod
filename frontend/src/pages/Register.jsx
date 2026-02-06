
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { Github } from 'lucide-react';

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
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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

    const handleSyncProfile = async (session) => {
        try {
            const { user } = session;
            const { data } = await api.post('/sync-profile', {
                email: user.email,
                username: formData.username, // Use the form data username
                full_name: '', // We don't ask for full name in register form yet
                avatar_url: '',
                role: formData.role, // Pass role
                bio: formData.bio     // Pass bio
            }, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            localStorage.setItem('user', JSON.stringify({
                ...data.user,
                token: session.access_token
            }));
            window.dispatchEvent(new Event("storage"));
            navigate('/', { replace: true });
        } catch (err) {
            console.error("Sync Profile Error:", err);
            setError("Account created but failed to sync profile. Please login.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuggestions([]);

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
            // Check username availability via backend *before* Supabase signup? 
            // Or just try Supabase and fail? Supabase doesn't enforce unique usernames in metadata.
            // But our backend DB enforces it.
            // Let's assume we proceed. If backend sync fails (conflict), we handle it.
            // Be better to check first?
            // "Legacy" check username logic is gone. 
            // Let's just create.

            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        role: formData.role,
                        bio: formData.bio
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                // Auto-login
                await handleSyncProfile(data.session);
            } else if (data.user) {
                // Email confirmation required
                setSuccessMessage("Account created! Please check your email to confirm registration.");
            }
        } catch (err) {
            setError(err.message || "Registration failed");
            // Improve: if username taken in backend sync, we might need complex handling.
            // For now, Supabase error is primary.
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
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
        <div className="flex min-h-[80vh] items-center justify-center py-10">
            <div className="w-full max-w-md p-6 rounded-lg border shadow-lg bg-card text-card-foreground">
                <h1 className="text-2xl font-bold mb-2 text-center text-yellow-500">Create Account</h1>
                <p className="text-sm text-gray-400 text-center mb-6">Join Invesa today</p>

                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="w-full bg-[#db4437] hover:bg-[#c53929] text-white border-0"
                    >
                        Google
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleSocialLogin('github')}
                        className="w-full bg-[#333] hover:bg-[#24292e] text-white border-0"
                    >
                        <Github className="mr-2 h-4 w-4" /> GitHub
                    </Button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or with email</span></div>
                </div>

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
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password (Min 8, Upper, Special)"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        name="confirm_password"
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />

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
        </div>
    );
};

export default Register;
