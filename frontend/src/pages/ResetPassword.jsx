import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

import Button from '../components/Button';
import Input from '../components/Input';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const validatePassword = (pwd) => {
        if (pwd.length < 8) return "Password must be at least 8 chars long";
        if (!/\d/.test(pwd)) return "Password must contain a number";
        if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain a special character";
        return null;
    };

    useEffect(() => {
        // Get token from URL query params
        if (!tokenFromUrl) {
            setError("Invalid or missing reset token.");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const pwdError = validatePassword(password);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        try {
            await api.post('/auth/reset-password', {
                token: token,
                new_password: password
            });

            setMessage("Password updated successfully! Redirecting to login...");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card text-card-foreground">
                <h1 className="text-2xl font-bold mb-6 text-center text-yellow-500">Set New Password</h1>

                {message && <div className="p-3 mb-4 text-sm text-green-500 bg-green-900/10 rounded-md border border-green-900/20">{message}</div>}
                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/10 rounded-md border border-red-900/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading || message}
                    />
                    <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading || message}
                    />
                    <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold" disabled={isLoading || message}>
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
