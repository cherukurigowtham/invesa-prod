import { useState, useEffect } from 'react';
import api from '../api';

const Matches = () => {
    const [matches, setMatches] = useState([]);
    const [isPremium, setIsPremium] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check URL for success param (PhonePe Redirect)
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'success') {
            verifyBackendSuccess();
        } else {
            fetchMatches();
        }
    }, []);

    const verifyBackendSuccess = async () => {
        try {
            await api.post('/payment/success');
            alert("Payment Successful! Premium Unlocked.");
            // Clean URL
            window.history.replaceState({}, document.title, "/matches");
            fetchMatches();
        } catch (error) {
            console.error("Verification failed", error);
        }
    };

    const fetchMatches = async () => {
        try {
            // Need middleware to set user_id from token/mock authentication
            // Current backend setup might need user_id passed or strictly handled via simple int parsing
            // Assuming current generic Auth handling for MVP
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            // Hack for MVP since we don't have JWT middleware fully robust on every endpoint yet
            // Matches endpoint expects user_id in context. 
            // Ideally we pass a header or the backend handles session.
            // For now, let's assume the backend will return 401 if not auth.

            // Since we don't have a token system, we might fail here unless we pass ID.
            // But let's try calling it. If it fails, we know we need to fix Auth middleware.
            const response = await api.get('/matches');

            setMatches(response.data.matches);
            setIsPremium(response.data.is_premium);
            setUserRole(response.data.role);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching matches:", error);
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            // Call Backend to get PhonePe Redirect URL
            const res = await api.post('/payment/initiate');
            const { url } = res.data;
            if (url) {
                window.location.href = url; // Redirect user to PhonePe
            } else {
                alert("Failed to initiate payment");
            }
        } catch (error) {
            console.error(error);
            alert("Payment failed");
        }
    };

    // Helper text
    const target = userRole === 'Investor' ? 'Founders' : 'Investors';

    if (loading) return <div className="flex justify-center p-10 text-white">Finding ideal matches...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
                        Invesa Match <span className="text-2xl">🔥</span>
                    </h1>
                    <p className="text-gray-400">
                        We found <span className="text-white font-bold">{matches.length} {target}</span> matching your profile.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches.map((match) => (
                        <div key={match.id} className="relative bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center overflow-hidden group hover:border-gray-700 transition-colors">

                            {/* Pro Badge */}
                            {match.is_locked && (
                                <div className="absolute top-3 right-3 bg-gray-800 text-xs px-2 py-1 rounded text-gray-400">
                                    Locked
                                </div>
                            )}

                            {/* Avatar */}
                            <div className={`w-20 h-20 rounded-full mb-4 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-2xl font-bold ${match.is_locked ? 'blur-sm opacity-50' : ''}`}>
                                {match.is_locked ? '?' : match.username.charAt(0).toUpperCase()}
                            </div>

                            {/* Name */}
                            <h3 className={`text-xl font-semibold mb-1 ${match.is_locked ? 'blur-sm select-none' : ''}`}>
                                {match.is_locked ? 'Hidden Name' : match.full_name || match.username}
                            </h3>

                            {/* Role */}
                            <p className="text-yellow-500 text-sm mb-4 font-medium uppercase tracking-wider">
                                {match.role}
                            </p>

                            {/* Bio - Always visible to hook them */}
                            <p className="text-gray-400 text-sm mb-6 line-clamp-3 italic">
                                "{match.bio || "No bio available..."}"
                            </p>

                            {/* Action Button */}
                            {match.is_locked ? (
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>🔒</span> Unlock Profile
                                </button>
                            ) : (
                                <button className="w-full bg-white hover:bg-gray-200 text-black py-2 rounded-lg font-bold transition-colors">
                                    Chat Now
                                </button>
                            )}

                            {/* Blur Overlay for Locked State */}
                            {match.is_locked && !isPremium && (
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Subtle hint on hover */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {!isPremium && matches.length > 0 && (
                    <div className="mt-12 text-center p-8 bg-[#111] border border-yellow-900/30 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
                        <h2 className="text-2xl font-bold text-white mb-2">Stop Missing Opportunities</h2>
                        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                            Unlock full access to verified Investors and Entrepreneurs.
                            Connect instantly and start building.
                        </p>
                        <button
                            onClick={handleUpgrade}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-full font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
                        >
                            Unlock All Matches for $1
                        </button>
                    </div>
                )}

                {matches.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No matches found yet. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Matches;
