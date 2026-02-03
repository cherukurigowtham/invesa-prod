import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import Input from './Input';
import api from '../api';

const ChatModal = ({ isOpen, onClose, idea, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Decide who is the other person.
    // If I am the creator of the idea (not possible with current logic calling this modal, but let's be safe), 
    // actually wait. This modal is opened by 'Interested User' wanting to chat with 'Founder'.
    // So 'otherUser' is the Founder (idea.user_id).
    // BUT the chat API needs sender/receiver.
    // currentUser is SENDER. idea.user_id is RECEIVER.
    // Wait, if I am the founder, I need to see messages from others. 
    // For MVP: Simple 1-on-1 chat context is tricky without a "Conversations" list.
    // Let's assume this Modal is ONLY for initiating/continuing chat from the Idea Card.
    // So it's always Current User <-> Idea Creator.

    const receiverId = idea.user_id;

    useEffect(() => {
        if (!isOpen) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages?user1=${currentUser.id}&user2=${receiverId}`);
                setMessages(response.data);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
        // Simple polling
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [isOpen, currentUser.id, receiverId]);

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
            setMessages(response.data);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg border p-4 flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-semibold">Chat about "{idea.title}"</h3>
                    <Button variant="ghost" onClick={onClose} size="sm">X</Button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2 p-2">
                    {messages && messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-lg px-3 py-2 max-w-[80%] ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2">
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
