import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const CompleteRegistration = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'Entrepreneur',
        bio: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [strength, setStrength] = useState(0);

    useEffect(() => {
        if (!token) {
            setError('Invalid registration link');
            setIsValidating(false);
            return;
        }

        // Validate token and get email
        const validateToken = async () => {
            try {
                const response = await api.get(`/auth/validate-token?token=${token}`);
                setEmail(response.data.email);
            } catch (err) {
                setError(err.response?.data?.error || 'Invalid or expired registration link');
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (strength < 3) {
            setError('Password is too weak. Please use at least 8 characters with letters, numbers, and symbols.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/complete-registration', {
                token,
                username: formData.username.trim(),
                password: formData.password,
                full_name: formData.full_name.trim(),
                role: formData.role,
                bio: formData.bio.trim()
            });

            // Auto-login
            localStorage.setItem('user', JSON.stringify(response.data.user));
            window.dispatchEvent(new Event("storage"));
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete registration');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStrength = (password) => {
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        setStrength(s);
    };

    if (isValidating) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Validating your link...</p>
                </div>
            </div>
        );
    }

    if (!token || (error && !email)) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card text-center">
                    <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
                    <p className="text-muted-foreground mb-4">{error || 'This registration link is invalid or has expired.'}</p>
                    <Link to="/register">
                        <Button className="w-full">Request New Link</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center py-8">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-2 text-center">Complete Registration</h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    Registering as <strong className="text-foreground">{email}</strong>
                </p>

                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            calculateStrength(e.target.value);
                        }}
                        required
                        disabled={isLoading}
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
                    <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={isLoading}
                    />
                    <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        disabled={isLoading}
                    >
                        <option value="Entrepreneur">Entrepreneur</option>
                        <option value="Investor">Investor</option>
                    </select>
                    <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={isLoading}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default CompleteRegistration;
