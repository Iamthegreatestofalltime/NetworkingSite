import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';  // import the required modules
import Comments from "./Comments";
import axios from 'axios';
import Connections from "./Connections";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
    const [posts, setPosts] = useState(null);
    const [user, setUser] = useState(null);  // Define user state variable
    const [searchQuery, setSearchQuery] = useState('');
    const history = useNavigate();

    const handleSearch = (event) => {
        event.preventDefault();
        history(`/search?query=${searchQuery}`);  // Updated line
    };    

    useEffect(() => {
        fetch("http://localhost:5000/api/posts")
            .then(res => res.json())
            .then(data => {
                if(data && Array.isArray(data)) {
                    setPosts(data);  // data already contains posts with user information
                } else {
                    console.error('Unexpected data format:', data);
                }
            })
            .catch(err => console.error("Error fetching posts:", err));
    }, []);
    

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

    return (
        <div className="bg-blue-50 min-h-screen flex flex-col">
            <div className="absolute left-12 top-40 bottom-0 w-96 hidden md:block">
                <Connections />
            </div>
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-between mb-4 mx-4 md:mx-0">
                    <form onSubmit={handleSearch} className="flex-grow bg-white rounded-full shadow-lg flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for posts..."
                            className="w-full py-2 px-4 rounded-full leading-tight focus:outline-none"
                        />
                        <button type="submit" className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none">
                            <i className="fas fa-search">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </i>
                        </button>
                    </form>
                    <div className="ml-4">
                        {user && (
                            <Link to={`/profile/${user._id}`} className="flex items-center">
                                <img src={user.profilePicture} alt={`${user.username}'s profile`} className="rounded-full w-10 h-10 mr-2" />
                                <span className="text-blue-600 font-bold hidden md:inline">{user.username}</span>
                            </Link>
                        )}
                    </div>
                </div>
                <div className="text-center mb-6 hidden md:flex justify-center">
                    <Link to='/post' className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                        Post
                    </Link>
                    <Link to='/meetpeople' className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ml-4">
                        Meet People
                    </Link>
                    <Link to='/notifications' className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ml-4">
                        Notifications
                    </Link>
                    <Link to='/mycommunities' className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ml-4">
                        Communities
                    </Link>
                </div>
                <div className="mx-auto md:w-3/5 space-y-6">
                    {posts ? posts.map((post, index) => (
                        <div key={index} className="bg-white p-5 lg:p-20 rounded-lg shadow-lg mx-2 md:mx-0">
                            {post.user && (
                                <Link to={`/profile/${post.user._id.toString()}`} className="flex items-center mb-3">
                                    {console.log(post.user.profilePicture)}
                                    <img src={`http://localhost:5000${post.user.profilePicture}`} alt={`${post.user.username}'s profile`} className="rounded-full w-10 h-10 mr-2" />
                                    <span className="text-lg font-medium text-blue-600">{post.user.username}</span>
                                </Link>
                            )}
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
            <div className="bg-white py-4 border-t border-gray-200 fixed bottom-0 w-full md:hidden flex justify-around items-center z-10">
                <Link to='/post' className="flex flex-col items-center">
                    <i className="fas fa-plus-circle text-xl text-blue-600"></i>
                    <span className="text-sm text-gray-700">Post</span>
                </Link>
                <Link to='/connections' className="flex flex-col items-center">
                    <i className="fas fa-users text-xl text-blue-600"></i>
                    <span className="text-sm text-gray-700">Connections</span>
                </Link>
                <Link to='/mycommunities' className="flex flex-col items-center">
                    <i className="fas fa-globe-americas text-xl text-blue-600"></i>
                    <span className="text-sm text-gray-700">Communities</span>
                </Link>
                <Link to='/meetpeople' className="flex flex-col items-center">  {/* New button */}
                    <i className="fas fa-handshake text-xl text-blue-600"></i>  {/* Icon of your choice */}
                    <span className="text-sm text-gray-700">Meet People</span>
                </Link>
                <Link to='/notifications' className="flex flex-col items-center">  {/* New button */}
                    <i className="fas fa-bell text-xl text-blue-600"></i>  {/* Icon of your choice */}
                    <span className="text-sm text-gray-700">Notifications</span>
                </Link>
            </div>
        </div>
    );
}