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
        <div className="container mx-auto max-w-2xl py-8">
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
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="Other">Select Category</option>
                        <option value="Tech">Technology</option>
                        <option value="Health">Health & Wellness</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Other">Other</option>
                    </select>
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
