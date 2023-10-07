import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Post from './Post';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';  // import the required modules
import { Link } from 'react-router-dom';
import Comments from './Comments';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function CommunityPage() {
    const { communityId } = useParams();
    const [community, setCommunity] = useState(null);
    const [showMembers, setShowMembers] = useState(false);
    const [posts, setPosts] = useState([]);
    const yourToken = localStorage.getItem('authToken');
    const loggedInUserId = localStorage.getItem('userId');
    const isMember = community ? community.members.some(member => member._id === loggedInUserId) : false;
    const [showPost, setShowPost] = useState(false);


        const handleJoinLeave = async () => {
            const action = isMember ? 'leave' : 'join';
            const response = await axios.post(
                `http://localhost:5000/api/community/${communityId}/${action}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${yourToken}`,
                    },
                }
            );
            const data = response.data;
            if (data.message) {
                setCommunity(prevCommunity => {
                    const updatedMembers = action === 'join'
                        ? [...prevCommunity.members, { _id: loggedInUserId }]  // Omitting the username property here
                        : prevCommunity.members.filter(member => member._id !== loggedInUserId);
                    return { ...prevCommunity, members: updatedMembers };
                });
            }
        };
        
        useEffect(() => {
            const fetchCommunity = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/community/${communityId}`);
                    setCommunity(response.data);
                } catch (error) {
                    console.error(error);
                }
            };
    
            fetchCommunity();
        }, [communityId]);
    
        useEffect(() => {
            const fetchPosts = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/community/${communityId}/posts`);
                    setPosts(response.data);
                } catch (error) {
                    console.error(error);
                }
            };
    
            fetchPosts();
        }, [communityId]);

    if (!community) return null;  // Loading...

    return (
        <div className="container mx-auto p-4">
            <button onClick={() => window.history.back()} className="ml-4 sm:ml-0 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
            <p className="text-lg text-gray-700 mb-4">{community.description}</p>
            <button 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                onClick={() => setShowMembers(!showMembers)}
            >
                {showMembers ? 'Hide Members' : 'Show Members'}
            </button>
            {showMembers && (
                <ul className="mb-4">
                {community.members.map(member => (
                    <li key={member._id} className="text-lg text-gray-700 mb-1">{member.username}</li>
                ))}
                </ul>
            )}
            <button 
                className={`bg-${isMember ? 'red' : 'green'}-500 hover:bg-${isMember ? 'red' : 'green'}-700 text-white font-bold py-2 px-4 rounded mb-4`} 
                onClick={handleJoinLeave}
            >
                {isMember ? 'Leave Community' : 'Join Community'}
            </button>
            <button 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4" 
                onClick={() => setShowPost(!showPost)}
            >
                {showPost ? 'Hide Post Page' : 'Show Post Page'}
            </button>
            {showPost && <Post communityId={communityId} />}
            <div className="mx-auto md:w-3/5 space-y-6">
            {posts ? posts.map((post, index) => (
                <div key={index} className="bg-white p-5 lg:p-20 rounded-lg shadow-lg mx-2 md:mx-0 mb-4">
                    {post.user && (
                        <Link to={`/profile/${post.user._id.toString()}`} className="flex items-center mb-3">
                            <img src={`http://localhost:5000${post.user.profilePicture}`} alt={`${post.user.username}'s profile`} className="rounded-full w-10 h-10 mr-2" />
                            <span className="text-lg font-medium text-blue-600">{post.user.username}</span>
                        </Link>
                    )}
                    {post.pictures && (
                        <Swiper
                            modules={[Navigation, Pagination]}
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
                    <div className="flex flex-wrap mb-4">
                        {post.hashtags && post.hashtags.map((hashtag, hashtagIndex) => (
                            <span key={hashtagIndex} className="hashtag text-blue-600 mr-2 mb-2">#{hashtag}</span>
                        ))}
                    </div>
                    <Comments postId={post._id} />
                </div>
            )) : <p className="text-center text-gray-500 text-lg py-10">Loading...</p>}
            </div>
        </div>
    );
}

export default CommunityPage;