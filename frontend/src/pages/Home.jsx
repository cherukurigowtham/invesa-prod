import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import IdeaCard from '../components/IdeaCard';
import Button from '../components/Button';

const Home = () => {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchIdeas = async () => {
            setLoading(true);
            try {
                const params = {};
                if (search) params.search = search;
                if (category && category !== 'All') params.category = category;

                const response = await api.get('/ideas', { params });
                setIdeas(response.data || []);
            } catch (error) {
                console.error("Failed to fetch ideas", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search a bit or just run on effect
        const timer = setTimeout(() => {
            fetchIdeas();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, category]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-black text-white pb-20">
            {/* Hero Section */}
            <section className="w-full py-12 bg-black border-b border-gray-900">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-primary">
                                Welcome to Invesa
                            </h1>
                            <p className="mx-auto max-w-[700px] text-gray-400 md:text-lg">
                                Discover, connect, and invest in local businesses.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto py-8 px-4 md:px-6">

                <div className="max-w-2xl mx-auto mb-8 space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            className="w-full h-12 rounded-full border border-gray-800 bg-[#111] px-6 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {['All', 'Food', 'Art', 'Tech', 'Retail'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${category === cat
                                    ? 'bg-primary text-black border-primary'
                                    : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8 max-w-2xl mx-auto">
                    {loading ? (
                        <p className="text-center text-gray-400">Loading ideas...</p>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {Array.isArray(ideas) && ideas.map((idea) => (
                                <IdeaCard key={idea.id} idea={idea} currentUser={currentUser} />
                            ))}
                        </div>
                    )}

                    {!loading && ideas.length === 0 && (
                        <p className="text-center text-muted-foreground">No ideas posted yet. Be the first!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
