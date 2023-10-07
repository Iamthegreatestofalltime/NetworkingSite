import React, { useState, useEffect } from "react";
import { Link, useParams } from 'react-router-dom';
import 'swiper/swiper-bundle.css';  // import Swiper styles if you haven't
import Comments from './Comments';  // import Comments component if you haven't
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';  // import the required modules
import axios from 'axios';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function ProfilePage() {
    const [posts, setPosts] = useState(null);
    const [user, setUser] = useState(null);  // New state for user data
    const { userId } = useParams();
    const [connections, setConnections] = useState([]);
    const loggedInUserId = localStorage.getItem('userId');
    const [connectionStatus, setConnectionStatus] = useState(null);
    
    useEffect(() => {
        // Removed line: const userId = localStorage.getItem('userId');  // Get userId from localStorage

        axios.get(`http://localhost:5000/api/user/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,  // Updated line: Use authToken as token
            }
        })
        .then(response => setUser(response.data))
        .catch(error => console.error('Error fetching user data:', error));
    
        axios.get(`http://localhost:5000/api/posts/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,  // Updated line: Use authToken as token
            }
        })
        .then(response => setPosts(response.data))
        .catch(error => console.error('Error fetching posts:', error));
    }, [userId]);

    useEffect(() => {
        axios.get('http://localhost:5000/connections', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => setConnections(response.data))
        .catch(error => console.error('Error fetching connections:', error));
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/connection/status', {
            params: { user1Id: loggedInUserId, user2Id: userId },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => setConnectionStatus(response.data))
        .catch(error => console.error('Error fetching connection status:', error));
    }, [userId, loggedInUserId]);

    async function handleConnect() {
        try {
            const response = await axios.post('http://localhost:5000/connection/request', {
                receiverId: userId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            console.log(response.data);
            setConnectionStatus('pending');  // Update connectionStatus state
        } catch (error) {
            console.error('Error:', error.message);
        }
    }    

    async function handleAccept(connectionId) {
        try {
            const response = await axios.post('http://localhost:5000/connection/accept', {
                connectionId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            console.log(response.data);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async function handleDeny(connectionId) {
        try {
            const response = await axios.post('http://localhost:5000/connection/deny', {
                connectionId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            console.log(response.data);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    async function handleDisconnect() {
        try {
            const response = await axios.post('http://localhost:5000/connection/remove', {
                receiverId: userId
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            console.log(response.data);
            setConnectionStatus(null);  // Update connectionStatus state
        } catch (error) {
            console.error('Error:', error.message);
        }
    }    

    async function deletePost(postId) {
        try {
            const response = await axios.delete(`http://localhost:5000/api/post/${postId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,  // Use userId as token
                }
            });
            
            // Check for successful deletion
            if (response.status === 200) {
                const newPosts = posts.filter(post => post._id !== postId);
                setPosts(newPosts);
            } else {
                throw new Error(response.data.error || 'An error occurred while deleting the post.');
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }    

    return(
        <div>
            <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            {loggedInUserId === userId && (
                <div className="fixed top-5 right-5">
                    <Link to='/manageprofile' className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                        Manage Profile
                    </Link>
                </div>
            )}
            {user && (
                <div className="profile-header bg-gray-100 p-4 mb-6">
                    <img src={user.profilePicture} alt={`${user.username}'s profile`} className="rounded-full w-24 h-24 mb-4" />
                    <h1 className="text-xl font-bold">{user.username}</h1>
                    <p className="text-gray-700">Bio: {user.bio}</p>
                    <p className="text-gray-700">Interests: {user.interests}</p>
                    <p className="text-gray-700">Age: {user.age}</p>
                    <Link to={`/message/${user._id}`} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
                        Message
                    </Link>
                    <button 
                        onClick={handleConnect} 
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        {connectionStatus === 'pending' ? 'Pending' : connectionStatus === 'connected' ? 'Remove Connection' : 'Connect'}
                    </button>
                    {loggedInUserId === userId && connections.length > 0 && (
                        <div className="connection-requests mt-4">
                            <h2 className="text-lg font-bold mb-2">Connection Requests:</h2>
                            {connections.map(connection => (
                                <div key={connection._id} className="flex items-center justify-between bg-white p-4 mb-2 rounded shadow">
                                    <div className="flex items-center">
                                        <img src={connection.requester.profilePicture} alt={`${connection.requester.username}'s profile`} className="rounded-full w-12 h-12 mr-4" />
                                        <p className="font-medium">{connection.requester.username}</p>
                                    </div>
                                    <div>
                                        <button onClick={() => handleAccept(connection._id)} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 mr-2">
                                            Accept
                                        </button>
                                        <button onClick={() => handleDeny(connection._id)} className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700">
                                            Deny
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="mx-auto md:w-3/5 space-y-6">
                    {Array.isArray(posts) ? posts.map((post, index) => (
                        <div key={index} className="bg-white p-5 lg:p-20 rounded-lg shadow-lg mx-2 md:mx-0">
                            {loggedInUserId === user._id.toString() && (
                                <button
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700"
                                onClick={() => deletePost(post._id)}
                                >
                                    Delete
                                </button>
                            )}
                            <p className="text-lg font-medium text-blue-600 mb-3">{post.user.username}</p>
                            {post.pictures && (
                                <Swiper
                                    modules={[Navigation, Pagination]}  // install the required modules
                                    spaceBetween={50}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{ clickable: true }}
                                    className="mb-4"
                                >
                                    {post.pictures.map((picture, pictureIndex) => (
                                        <SwiperSlide key={pictureIndex}>
                                            <img src={`data:image/jpeg;base64,${picture}`} alt={`Post ${index}`} className="rounded object-scale-down w-full" />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            )}
                            <p className="mb-4 text-gray-700">{post.content}</p>
                            <div className="flex flex-wrap">
                                {post.hashtags && post.hashtags.map((hashtag, hashtagIndex) => (
                                    <span key={hashtagIndex} className="hashtag text-blue-600 mr-2 mb-2">#{hashtag}</span>
                                ))}
                            </div>
                            <Comments postId={post._id} />
                        </div>
                    )) : <p className="text-center text-gray-500">Loading...</p>}
            </div>
        </div>
    );
}

export default ProfilePage;