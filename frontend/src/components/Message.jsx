import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Message() {
    const { userId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const token = localStorage.getItem('authToken');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5000/messages/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessages(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchMessages();
    }, [userId]);

    const handleSend = async () => {
        const senderId = localStorage.getItem('userId');
        if (!senderId) {
            console.error('No senderId found in local storage');
            return;
        }

        try {
            axios.post('http://localhost:5000/send-message', {
                receiverId: userId,
                content: newMessage,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                console.log(response.data);
                setNewMessage('');
                setMessages(prevMessages => [...prevMessages, {
                    _id: response.data.message._id,
                    content: newMessage,
                    sender: senderId,
                    receiver: userId
                }]);
            })
            .catch(error => {
                console.error(error);
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 p-4">
            <button onClick={() => window.history.back()} className="mb-5 ml-4 sm:ml-0 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            <div className="flex-1 overflow-y-auto">
                {messages.map(message => (
                    <div key={message._id} className="mb-2 p-2 rounded-lg bg-white shadow">
                        <div className="text-sm text-gray-600">
                            {message.sender.username}
                        </div>
                        <div className="text-base">
                            {message.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center mt-4">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-2 rounded-l-lg border-t border-l border-b border-gray-300 outline-none"
                    placeholder="Type a message"
                />
                <button
                    onClick={handleSend}
                    className="bg-green-500 text-white p-2 rounded-r-lg border-t border-r border-b border-green-500"
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Message;