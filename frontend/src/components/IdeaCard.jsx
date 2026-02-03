import { useState } from 'react';
import Button from './Button';
import ChatModal from './ChatModal';
import api from '../api';

const IdeaCard = ({ idea, currentUser }) => {
    const [likes, setLikes] = useState(idea.likes_count || 0);
    const [isLiked, setIsLiked] = useState(idea.is_liked || false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Show chat button to everyone except the owner
    const showChatButton = !currentUser || (currentUser && currentUser.id !== idea.user_id);

    const handleChatClick = () => {
        if (!currentUser) {
            alert("Please login to chat with this business.");
            return;
        }
        setIsChatOpen(true);
    };

    const handleLike = async () => {
        if (!currentUser) return alert("Please login to like ideas.");
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
        try {
            await api.post(`/ideas/${idea.id}/like`, { user_id: currentUser.id });
        } catch (e) {
            console.error(e);
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    return (
        <div className="rounded-xl border border-gray-900 bg-[#0a0a0a] p-6 hover:border-gray-800 transition-colors flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                    <span className="items-center rounded-full border border-gray-800 bg-[#111] px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                        {idea.category || 'Other'}
                    </span>
                </div>
                <p className="text-gray-400 mb-6 whitespace-pre-wrap">{idea.description}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-900 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                    {new Date(idea.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleLike}
                        className={`h-8 px-3 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                        ❤️ {likes}
                    </Button>

                    {showChatButton && (
                        <Button
                            onClick={handleChatClick}
                            className="bg-primary text-black hover:bg-yellow-400 h-8 px-4 text-sm font-medium"
                        >
                            Chat
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat Modal - conditionally rendered */}
            {isChatOpen && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    idea={idea}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default IdeaCard;
