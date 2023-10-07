import React, { useState, useEffect } from "react";
import axios from "axios";
import jwtDecode from "jwt-decode";

function Post({ communityId }) {
    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [pictures, setPictures] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState(communityId || '');

    const handleFileChange = (event) => {
        setPictures(prevPictures => {
            // Concatenate the new files with the already selected files
            return prevPictures.concat(Array.from(event.target.files));
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            console.error("No auth token found");
            return;
        }
        const decodedToken = jwtDecode(authToken);
        const userId = decodedToken.id;  // Assuming your token has an 'id' property with the user ID

        // Frontend
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);
        formData.append('hashtags', hashtags);
        pictures.forEach((picture, index) => {
            formData.append('pictures', picture);
        });        

        try {
            // Update the URL to include the community ID when a community is selected
            const postUrl = selectedCommunityId ? 
                `http://localhost:5000/community/${selectedCommunityId}/post` : 
                "http://localhost:5000/post";
                
            const response = await axios.post(
                postUrl,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            console.log(response.data);
        } catch (error) {
            console.error("There was an error!", error);
        }
    }

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/myCommunities', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // Assuming you store token in localStorage
                    }
                });
                setCommunities(response.data);
            } catch (error) {
                console.error('Failed to fetch communities:', error);
            }
        };
    
        fetchCommunities();
    }, []);    

    return(
        <div className="bg-blue-50 min-h-screen">
            <div className="container mx-auto py-12">
                <button onClick={() => window.history.back()} className="ml-4 sm:ml-0 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Back
                </button>
                <p className="text-center text-2xl font-semibold mb-6 text-blue-800">Posting Page</p>
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="bg-white p-6 rounded-lg shadow-lg m-4 md:m-0">
                    <textarea 
                        placeholder="Content" 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2 mb-4 border rounded-lg"
                    />
                    <input 
                        type="text" 
                        placeholder="Hashtags (comma separated)" 
                        value={hashtags} 
                        onChange={(e) => setHashtags(e.target.value)}
                        className="w-full p-2 mb-4 border rounded-lg"
                    />
                    <input 
                        type="file" 
                        name="pictures" 
                        multiple 
                        onChange={handleFileChange} 
                        className="w-full p-2 mb-4 border rounded-lg"
                    />
                    <select 
                        value={selectedCommunityId}
                        onChange={(e) => setSelectedCommunityId(e.target.value)}
                        className="w-full p-2 mb-4 border rounded-lg"
                    >
                        <option value="">Select a Community (Optional)</option>
                        {/* Assume communities is an array of community objects */}
                        {communities.map(community => (
                            <option value={community._id} key={community._id}>
                                {community.name}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Submit</button>
                </form>
                <div className="mt-8 md:m-0 flex flex-col md:grid md:grid-cols-4 items-center">
                    {/* Map over the pictures array and display each image */}
                    {pictures.map((picture, index) => (
                        <img 
                            key={index} 
                            src={URL.createObjectURL(picture)} 
                            alt={`Selected for upload ${index + 1}`} 
                            className="w-80 h-80 object-cover rounded-lg shadow-lg m-2"  // Optional: style to resize images
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Post;