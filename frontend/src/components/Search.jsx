import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';  // import the required modules
import Comments from "./Comments";
import axios from 'axios';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function Search() {
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');  // New state for the search query
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query');
    const history = useNavigate();  // Use useNavigate for routing
    const [searchResults, setSearchResults] = useState(null);
    const [filter, setFilter] = useState('all');  // default to showing all results
    const [communities, setCommunities] = useState([]);

    const handleBackButtonClick = () => {
        window.history.back();  // Navigate to the previous page
    };

    const handleSearch = (event) => {  // Search handler
        event.preventDefault();
        history(`/search?query=${searchQuery}`);
    };

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/search?query=${query}`);
                setSearchResults(response.data);
                setCommunities(response.data.communities);  // New line to set communities
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        };
    
        fetchSearchResults();
    }, [query]);      

    return (
        <div className="px-4 lg:px-0">
            <div className="flex items-center justify-between mb-4 mx-auto w-4/5 md:w-3/5 mt-8">
                <button onClick={handleBackButtonClick} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-full shadow-lg w-full">
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
            </div>
            <div className="mx-auto w-full md:w-3/5">
                <p className="text-lg font-semibold mb-4">Search results for "{query}":</p>
                <div className="flex space-x-4 mb-4">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`py-2 px-4 ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        All Results
                    </button>
                    <button 
                        onClick={() => setFilter('users')}
                        className={`py-2 px-4 ${filter === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Only Users
                    </button>
                    <button 
                        onClick={() => setFilter('posts')}
                        className={`py-2 px-4 ${filter === 'posts' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Only Posts
                    </button>
                    <button 
                        onClick={() => setFilter('communities')}
                        className={`py-2 px-4 ${filter === 'communities' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Only Communities
                    </button>
                </div>
                {
                    {
                        'all': (
                            <>
                                {renderPosts()}
                                {renderUsers()}
                                {renderCommunities()}
                            </>
                        ),
                        'users': renderUsers(),
                        'posts': renderPosts(),
                        'communities': renderCommunities(),
                    }[filter]
                }         
            </div>
        </div>
    );

    function renderCommunities() {
        if (!searchResults?.communities) return null;
        if (searchResults.communities.length === 0) return <p>No communities found.</p>;
    
        return searchResults.communities.map((community, index) => (
            <div key={index} className="bg-white p-5 lg:p-20 rounded-lg shadow-lg md:mx-auto max-w-screen-md mb-4">
                <Link to={`/community/${community._id}`} className="text-lg font-medium text-blue-600">
                    {community.name}
                </Link>
                <p className="text-gray-700">{community.description}</p>
                <p>Admin: {community.admin.username}</p>
                <p>Members: {community.members.map(member => member.username).join(', ')}</p>
            </div>
        ));
    }

    function renderPosts() {
        if (!searchResults?.posts) return <p className="text-center text-gray-500">Loading...</p>;
        if (searchResults.posts.length === 0) return <p>No posts found.</p>;
    
        return searchResults.posts.map((post, index) => (
            <div key={index} className="bg-white p-5 lg:p-20 rounded-lg shadow-lg md:mx-auto max-w-screen-md mb-4">
                {post.user && (
                    <Link to={`/profile/${post.user._id.toString()}`} className="flex items-center mb-3">
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
        ));
    }
    
    function renderUsers() {
        if (!searchResults?.users) return null;
        if (searchResults.users.length === 0) return <p>No users found.</p>;
    
        return searchResults.users.map((user, index) => (
            <div key={index} className="flex items-center mb-4">
                <Link to={`/profile/${user._id}`} className="flex items-center">
                    <img src={user.profilePicture} alt={`${user.username}'s profile`} className="rounded-full w-10 h-10 mr-2" />
                    <div className="flex flex-col sm:flex-row">
                        <span className="text-lg font-medium text-blue-600 mr-2">{user.username}</span>
                        <span className="text-gray-600 text-sm">{user.interests ? user.interests : 'No interests listed'}</span>
                    </div>
                </Link>
            </div>
        ));
    }

}

export default Search;