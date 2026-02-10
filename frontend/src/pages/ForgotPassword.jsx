import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage("If this email exists, a reset link has been sent.");
        } catch (err) {
            setError("Failed to send reset link. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card text-card-foreground">
                <h1 className="text-2xl font-bold mb-2 text-center text-yellow-500">Reset Password</h1>
                <p className="text-sm text-center text-gray-400 mb-6">Enter your email to receive a reset link</p>

                {message && <div className="p-3 mb-4 text-sm text-green-500 bg-green-900/10 rounded-md border border-green-900/20">{message}</div>}
                {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-900/10 rounded-md border border-red-900/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading || message}
                    />
                    <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold" disabled={isLoading || message}>
                        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    </Button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
