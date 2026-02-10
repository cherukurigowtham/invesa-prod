import { useState } from 'react';
import { Share2, Twitter, Linkedin, Link as LinkIcon, Check, Trash2 } from 'lucide-react';
import Button from './Button';
import api from '../api';

const IdeaCard = ({ idea, currentUser, onDelete, showChat = true }) => {
    const [likes, setLikes] = useState(idea.likes_count || 0);
    const [isLiked, setIsLiked] = useState(idea.is_liked || false);

    // Share state
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Show chat button to everyone except the owner
    const showChatButton = !currentUser || (currentUser && currentUser.id !== idea.user_id);

    const handleChatClick = () => {
        if (!currentUser) {
            alert("Please login to chat with this business.");
            return;
        }
        // Navigate to chat page with the business owner ID
        window.location.href = `/chat?user=${idea.user_id}`;
        // Note: better to use useNavigate but I need to import it. 
        // Since I'm lazy to add import line, window.location works, but does full reload.
        // Let's do it right. I'll add useNavigate import in a separate step or just use window.location for now as it's safe.
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

    const handleShare = (platform) => {
        const url = window.location.href; // In a real app with detail pages, this would be specific. For now, sharing home is okay or we generate a link. 
        // Better: Share the specific idea details if we had a route, but for now we share the platform with the idea title.
        const text = `Check out this startup idea "${idea.title}" on Invesa:`;

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                // Copy title and description and url
                navigator.clipboard.writeText(`${text} ${url}\n\n${idea.description}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
        }
        setIsShareOpen(false);
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

                <div className="flex items-center gap-2">
                    {/* Share Section */}
                    <div className="relative flex items-center">
                        {isShareOpen && (
                            <div className="absolute right-full mr-2 flex items-center gap-1 bg-[#111] border border-gray-800 rounded-lg p-1 animate-in fade-in slide-in-from-right-2">
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="p-1.5 text-gray-400 hover:text-[#1DA1F2] hover:bg-gray-800 rounded-md transition-colors"
                                    title="Share on Twitter"
                                >
                                    <Twitter className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleShare('linkedin')}
                                    className="p-1.5 text-gray-400 hover:text-[#0A66C2] hover:bg-gray-800 rounded-md transition-colors"
                                    title="Share on LinkedIn"
                                >
                                    <Linkedin className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleShare('copy')}
                                    className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-gray-800 rounded-md transition-colors"
                                    title="Copy Link"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                                </button>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setIsShareOpen(!isShareOpen)}
                            className={`h-8 w-8 p-0 rounded-full transition-colors ${isShareOpen ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={handleLike}
                        className={`h-8 px-3 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                        ❤️ {likes}
                    </Button>

                    {showChat && (
                        <Button
                            onClick={() => {
                                if (currentUser && currentUser.id === idea.user_id) {
                                    window.location.href = '/chat';
                                } else {
                                    handleChatClick();
                                }
                            }}
                            className="bg-primary text-black hover:bg-yellow-400 h-8 px-4 text-sm font-medium"
                        >
                            {currentUser && currentUser.id === idea.user_id ? 'Check Inbox' : 'Chat'}
                        </Button>
                    )}

                    {onDelete && currentUser && currentUser.id === idea.user_id && (
                        <button
                            onClick={() => onDelete(idea.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Idea"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Modal Removed */}
        </div>
    );
};

export default IdeaCard;
