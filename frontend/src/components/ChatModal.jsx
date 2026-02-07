import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import Input from './Input';
import api from '../api';

const ChatModal = ({ isOpen, onClose, idea, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Safety check: if no user is logged in, don't crash, just return null or close.
    // Ideally, the parent shouldn't render this if !currentUser, but let's be safe.
    if (!currentUser || !idea) return null;

    const receiverId = idea.user_id;

    useEffect(() => {
        if (!isOpen) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages?user1=${currentUser.id}&user2=${receiverId}`);
                const items = response.data?.items ?? response.data ?? [];
                setMessages(items);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
        // Simple polling
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [isOpen, currentUser?.id, receiverId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('/messages', {
                sender_id: currentUser.id,
                receiver_id: receiverId,
                content: newMessage
            });
            setNewMessage('');
            // Optimistic update or wait for poll
            // Let's wait for poll or just refetch immediately
            const response = await api.get(`/messages?user1=${currentUser.id}&user2=${receiverId}`);
            const items = response.data?.items ?? response.data ?? [];
            setMessages(items);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-background rounded-lg shadow-lg border p-4 flex flex-col h-[80vh] max-h-[600px]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-semibold truncate pr-2">Chat about "{idea.title}"</h3>
                    <Button variant="ghost" onClick={onClose} size="sm">X</Button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2 p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {messages && messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-lg px-3 py-2 max-w-[85%] break-words ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2 mt-auto">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit">Send</Button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
