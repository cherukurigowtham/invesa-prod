import { useState } from 'react';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const AdminAds = () => {
    const [adminKey, setAdminKey] = useState('');
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAds = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/ads', {
                headers: { 'X-Admin-Key': adminKey }
            });
            setAds(response.data?.items || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load ads');
        } finally {
            setLoading(false);
        }
    };

    const markPaid = async (id) => {
        setLoading(true);
        setError('');
        try {
            await api.post(`/admin/ads/${id}/mark-paid`, null, {
                headers: { 'X-Admin-Key': adminKey }
            });
            await fetchAds();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to activate ad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-black text-white pb-24">
            <div className="container mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-xl border border-gray-800 bg-[#0b0b0b] p-6 shadow-lg">
                    <h1 className="text-2xl font-bold mb-2">Admin Ads Dashboard</h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Load submitted ads and mark them as paid to activate.
                    </p>

                    {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Input
                            type="password"
                            placeholder="Admin Key"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            disabled={loading}
                        />
                        <Button onClick={fetchAds} disabled={loading || !adminKey}>
                            Load Ads
                        </Button>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {ads.map((ad) => (
                        <div key={ad.id} className="rounded-xl border border-gray-800 bg-[#111] p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">{ad.headline || ad.advertiser_name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{ad.requirements}</p>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Placement: {ad.placement} • Price: ₹{ad.price_inr} • Status: {ad.status}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {ad.status !== 'active' && (
                                        <Button onClick={() => markPaid(ad.id)} disabled={loading}>
                                            Mark Paid
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && ads.length === 0 && (
                        <div className="text-sm text-gray-500">No ads found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAds;
