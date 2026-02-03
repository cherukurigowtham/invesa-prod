import { useEffect, useState } from 'react';
import api from '../api';
import IdeaCard from '../components/IdeaCard';

const Profile = () => {
    const [myIdeas, setMyIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchMyIdeas = async () => {
            if (!user) return;
            try {
                // Using the main ideas endpoint with a user_id filter
                const response = await api.get(`/ideas?user_id=${user.id}`);
                setMyIdeas(response.data || []);
            } catch (error) {
                console.error("Failed to fetch my ideas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyIdeas();
    }, [user?.id]);

    if (!user) {
        return <div className="container mx-auto py-8 text-center">Please login to view your profile.</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-bold">{user.full_name || user.username}</h1>
                        <p className="text-muted-foreground">@{user.username} • {user.email}</p>
                        {user.role && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                {user.role}
                            </span>
                        )}
                        {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                    </div>
                    <div className="ml-auto flex gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{myIdeas.length}</div>
                            <div className="text-xs text-muted-foreground">Ideas Posted</div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">My Ideas</h2>
            {loading ? (
                <p>Loading...</p>
            ) : myIdeas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myIdeas.map((idea) => (
                        <IdeaCard key={idea.id} idea={idea} currentUser={user} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">You haven't posted any ideas yet.</p>
            )}
        </div>
    );
};

export default Profile;
