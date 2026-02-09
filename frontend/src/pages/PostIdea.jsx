import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const PostIdea = () => {
    const [formData, setFormData] = useState({ title: '', description: '', category: 'Other' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return navigate('/login');

        try {
            await api.post('/ideas', {
                ...formData,
                user_id: user.id
            });
            navigate('/');
        } catch (error) {
            console.error("Failed to post idea", error);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Post a Business Idea</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Uber for Cats"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <div className="relative">
                        <select
                            className="flex h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Other" className="bg-black text-white">Select Category</option>
                            <option value="Technology" className="bg-black text-white">Technology</option>
                            <option value="Health & Wellness" className="bg-black text-white">Health & Wellness</option>
                            <option value="Finance" className="bg-black text-white">Finance</option>
                            <option value="Education" className="bg-black text-white">Education</option>
                            <option value="Lifestyle" className="bg-black text-white">Lifestyle</option>
                            <option value="Food & Beverage" className="bg-black text-white">Food & Beverage</option>
                            <option value="Art & Design" className="bg-black text-white">Art & Design</option>
                            <option value="Retail" className="bg-black text-white">Retail</option>
                            <option value="Other" className="bg-black text-white">Other</option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your business idea in detail..."
                        required
                    />
                </div>

                <Button type="submit" className="text-black font-semibold">Post Idea</Button>
            </form>
        </div>
    );
};

export default PostIdea;
