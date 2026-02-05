import { useState } from 'react';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Advertise = () => {
    const [formData, setFormData] = useState({
        advertiser_name: '',
        contact_email: '',
        placement: 'home',
        headline: '',
        cta_url: '',
        categories: '',
        locations: '',
        duration_days: 7,
        message: ''
    });
    const [quote, setQuote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const parseList = (value) =>
        value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

    const handleQuote = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/ads/quote', {
                placement: formData.placement,
                categories: parseList(formData.categories),
                locations: parseList(formData.locations),
                duration_days: Number(formData.duration_days) || 7
            });
            setQuote(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch quote');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/ads', {
                advertiser_name: formData.advertiser_name.trim(),
                contact_email: formData.contact_email.trim(),
                placement: formData.placement,
                headline: formData.headline.trim(),
                cta_url: formData.cta_url.trim(),
                categories: parseList(formData.categories),
                locations: parseList(formData.locations),
                duration_days: Number(formData.duration_days) || 7,
                message: formData.message.trim()
            });
            setSuccess(response.data?.message || 'Ad request submitted');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit ad request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-black text-white pb-24">
            <div className="container mx-auto max-w-2xl px-4 py-10">
                <div className="rounded-xl border border-gray-800 bg-[#0b0b0b] p-6 shadow-lg">
                    <h1 className="text-2xl font-bold mb-2">Advertise on Invesa</h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Reach founders and investors. We calculate your price based on requirements. Payment is manual for now.
                    </p>

                    {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
                    {success && <div className="mb-4 text-sm text-green-400">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Company / Advertiser Name"
                            value={formData.advertiser_name}
                            onChange={(e) => setFormData({ ...formData, advertiser_name: e.target.value })}
                            required
                            disabled={isLoading}
                        />
                        <Input
                            type="email"
                            placeholder="Contact Email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            required
                            disabled={isLoading}
                        />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Placement</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.placement}
                                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                                    disabled={isLoading}
                                >
                                    <option value="home">Home Feed</option>
                                    <option value="matches">Matches Page</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Duration (days)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.duration_days}
                                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Input
                            placeholder="Ad headline (optional)"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            disabled={isLoading}
                        />
                        <Input
                            placeholder="CTA URL (optional)"
                            value={formData.cta_url}
                            onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                            disabled={isLoading}
                        />
                        <Input
                            placeholder="Target categories (comma separated)"
                            value={formData.categories}
                            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                            disabled={isLoading}
                        />
                        <Input
                            placeholder="Target locations (comma separated)"
                            value={formData.locations}
                            onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                            disabled={isLoading}
                        />
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                            placeholder="Tell us your requirements or message..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            disabled={isLoading}
                        />

                        <div className="flex flex-col gap-3 md:flex-row">
                            <Button type="button" variant="outline" onClick={handleQuote} disabled={isLoading}>
                                Get Quote
                            </Button>
                            <Button type="submit" className="md:flex-1" disabled={isLoading}>
                                Submit Ad Request
                            </Button>
                        </div>

                        {quote && (
                            <div className="rounded-lg border border-yellow-700/40 bg-yellow-500/5 p-4 text-sm text-yellow-300">
                                Estimated price: ₹{quote.price_inr}. {quote.notes}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Advertise;
