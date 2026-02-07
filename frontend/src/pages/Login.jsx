import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { Github, Mail } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSyncProfile = async (session) => {
        try {
            const { user } = session;
            const { data } = await api.post('/sync-profile', {
                email: user.email,
                username: user.user_metadata?.username || user.email.split('@')[0],
                full_name: user.user_metadata?.full_name || '',
                avatar_url: user.user_metadata?.avatar_url || ''
            }, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            // Save user and token to local storage
            localStorage.setItem('user', JSON.stringify({
                ...data.user,
                token: session.access_token // Map Supabase token to 'token' for api.js
            }));
            window.dispatchEvent(new Event("storage"));
            navigate('/', { replace: true });
        } catch (err) {
            console.error("Sync Profile Error:", err);
            setError("Failed to sync user profile.");
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;
            if (data.session) {
                await handleSyncProfile(data.session);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        if (localStorage.getItem('user')) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm p-6 rounded-lg border shadow-lg bg-card text-card-foreground">
                <h1 className="text-2xl font-bold mb-6 text-center">Login to Invesa</h1>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login with Email'}
                    </Button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
