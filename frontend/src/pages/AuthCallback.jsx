import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import api from '../api';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the session from the URL hash or query params
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;
                if (!session) {
                    // Sometimes session is not immediately available, check if we have code
                    const code = searchParams.get('code');
                    if (code) {
                        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                        if (exchangeError) throw exchangeError;
                        if (data.session) {
                            await syncProfile(data.session);
                            return;
                        }
                    }
                    throw new Error("No session found");
                }

                await syncProfile(session);

            } catch (err) {
                console.error("Auth Callback Error:", err);
                setError(err.message || "Failed to complete login.");
                // navigate('/login'); // Optional: redirect back to login on error
            }
        };

        const syncProfile = async (session) => {
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
                    token: session.access_token
                }));

                window.dispatchEvent(new Event("storage"));
                navigate('/', { replace: true });

            } catch (err) {
                console.error("Sync Profile Error:", err);
                setError("Failed to sync user profile.");
            }
        }

        handleAuthCallback();
    }, [navigate, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
            <div className="text-center">
                {error ? (
                    <div>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-primary hover:underline"
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <p className="text-xl animate-pulse">Processing login...</p>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
