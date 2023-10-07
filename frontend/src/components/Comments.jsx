import React, { useEffect, useState } from "react";
import axios from 'axios';

function Comments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState(null);  // Define user state variable
    const [showComments, setShowComments] = useState(false);  // State to toggle comments visibility

    useEffect(() => {
        fetch(`http://localhost:5000/comments/${postId}`)
            .then(res => res.json())
            .then(data => setComments(data))
            .catch(err => console.error("Error fetching comments:", err));
    }, [postId]);

    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if(authToken) {
            axios.get('http://localhost:5000/api/user', { 
                headers: { Authorization: `Bearer ${authToken}` } 
            })
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const authToken = localStorage.getItem('authToken');
        if(authToken && user) {  // Ensure user is populated
            try {
                const response = await axios.post('http://localhost:5000/comment', { content: newComment, postId }, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                const newCommentData = response.data;
                newCommentData.user = { username: user.username };  // user is now in scope
                newCommentData.content = newComment;  // Manually set the content of the new comment
                setComments(prevComments => [...prevComments, newCommentData]);
                setNewComment('');
            } catch (error) {
                console.error('Error creating comment:', error);
            }
        }
    };    

    return (
        <div className="mt-2">
            <button onClick={() => setShowComments(!showComments)} className="flex items-center text-gray-600 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="ml-2">Comments</span>
            </button>
            {showComments && (
                <div className="bg-gray-100 p-4 rounded shadow-lg mt-2">
                    <form onSubmit={handleSubmit} className="mb-4 flex items-center">
                        <textarea 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            required 
                            className="w-full p-2 border rounded mr-2"
                            placeholder="Add a comment..."
                            rows="1"
                        ></textarea>
                        <button type="submit" className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                    {comments.map((comment, index) => (
                        <div key={index} className="mb-2 p-2 border rounded bg-white">
                            <p className="font-semibold">{comment.user.username}</p>
                            <p className="text-gray-700">{comment.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Comments;