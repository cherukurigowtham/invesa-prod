import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Button from '../components/Button';
import Input from '../components/Input';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if we have a session (Supabase handles the hash fragment token automatically)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, it might be that the token loop hasn't finished or link is invalid.
                // But typically, supabase-js processes the #token immediately on load if correctly initialized.
                // We'll let them try, or show an error if update fails.
                // Alternatively, we could redirect to login if no session found after a delay.
            }
        });
    }, []);

    const validatePassword = (pwd) => {
        if (pwd.length < 8) return "Password must be at least 8 chars long";
        if (!/\d/.test(pwd)) return "Password must contain a number";
        if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain a special character";
        return null;
    };

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

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage("Password updated successfully! Redirecting to login...");
            // Optional: Sign out so they have to log in with new password? 
            // Or keep them logged in. Usually better UX to keep logged in or redirect home.
            // But let's follow the standard "Back to Login" flow for clarity.
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
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
