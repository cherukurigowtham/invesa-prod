import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Register = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/initiate-registration', { email: email.trim() });
            setSuccess(response.data.message || 'Check your email for a link to complete registration');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send registration link');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-2 text-center">Create Account</h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    Enter your email to get started
                </p>

                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-green-500 font-semibold">{success}</p>
                        <p className="text-sm text-muted-foreground">
                            We've sent a magic link to <strong>{email}</strong>.
                            Click the link in your email to complete your registration.
                        </p>
                        <Button
                            onClick={() => { setSuccess(''); setEmail(''); }}
                            className="w-full mt-4"
                            variant="outline"
                        >
                            Send to a different email
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Magic Link'}
                        </Button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
