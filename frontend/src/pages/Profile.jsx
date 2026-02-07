import { useEffect, useState } from 'react';
import api from '../api';
import IdeaCard from '../components/IdeaCard';

const Profile = () => {
    const [myIdeas, setMyIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [editUsername, setEditUsername] = useState(user?.username || '');

    const handleUpdateProfile = async () => {
        try {
            const response = await api.put('/profile', { username: editUsername });
            const updatedUser = { ...user, ...response.data.user, token: user.token }; // Keep token
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            window.dispatchEvent(new Event("storage")); // Update Navbar
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update username. It might be taken.");
        }
    };

    useEffect(() => {
        const fetchMyIdeas = async () => {
            if (!user) return;
            try {
                // Using the main ideas endpoint with a user_id filter
                const response = await api.get(`/ideas?user_id=${user.id}`);
                const items = response.data?.items ?? response.data ?? [];
                setMyIdeas(items);
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
                    <div className="text-center md:text-left space-y-2 flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="bg-transparent border-b border-white px-1 py-0.5 focus:outline-none focus:border-primary text-3xl font-bold w-48"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateProfile} className="text-green-500 hover:text-green-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setEditUsername(user.username); }} className="text-red-500 hover:text-red-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold">{user.full_name || user.username}</h1>
                                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                </>
                            )}
                        </div>
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
