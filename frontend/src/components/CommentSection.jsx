import { useState, useEffect } from 'react';
import api from '../api';
import Button from './Button';

const CommentSection = ({ ideaId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await api.get(`/ideas/${ideaId}/comments`);
                setComments(response.data || []);
            } catch (error) {
                console.error("Failed to fetch comments", error);
            } finally {
                setLoading(false);
            }
        };

        if (ideaId) fetchComments();
    }, [ideaId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        if (!currentUser) return alert("Please login to comment.");

        try {
            await api.post(`/ideas/${ideaId}/comments`, {
                user_id: currentUser.id,
                content: newComment
            });
            // Refresh comments
            const response = await api.get(`/ideas/${ideaId}/comments`);
            setComments(response.data || []);
            setNewComment('');
        } catch (error) {
            console.error("Failed to post comment", error);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Comments</h4>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {loading ? (
                    <p className="text-xs text-muted-foreground">Loading comments...</p>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                            <span className="font-semibold mr-2">{comment.username}</span>
                            <span className="text-muted-foreground">{comment.content}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
                )}
            </div>

            {currentUser && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    />
                    <Button size="sm" onClick={handlePostComment}>Post</Button>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
