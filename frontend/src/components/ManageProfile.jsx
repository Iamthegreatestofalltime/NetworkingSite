import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";  // Import useHistory

function ManageProfile () {
    const [bio, setBio] = useState('');
    const [interests, setInterests] = useState('');
    const [age, setAge] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const navigate = useNavigate();  // Instantiate useHistory

    useEffect(() => {
        const fetchProfile = async () => {
            const userId = localStorage.getItem('userId');  // Assuming userId is stored in localStorage
            try {
                const response = await axios.get(`http://localhost:5000/api/user/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`  // Assuming authToken is stored in localStorage
                    }
                });
                const user = response.data;
                setBio(user.bio);
                setInterests(user.interests);
                setAge(user.age || '');
                // Set profile picture URL to state if you want to display current profile picture
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken');
        navigate('/login');  // Redirect to /login
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('bio', bio);
        formData.append('interests', interests);
        formData.append('age', age);
        if(profilePicture) {
            formData.append('profilePicture', profilePicture);
        }
        const userId = localStorage.getItem('userId');  // Assuming userId is stored in localStorage
        try {
            const response = await axios.post('http://localhost:5000/updateProfile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`  // Assuming authToken is stored in localStorage
                },
                params: { userId }
            });
            console.log('Profile updated:', response.data);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    return ( 
        <div>
            <p>Manage Profile</p>
            <div className="fixed top-5 right-5">
                <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Back to Profile
                </button>
                <button onClick={handleLogout} className="inline-block bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">
                    Logout
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <label>
                    Bio:
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
                </label>
                <label>
                    Interests:
                    <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} />
                </label>
                <label>
                    Age:
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                </label>
                <label>
                    Profile Picture:
                    <input type="file" onChange={handleFileChange} />
                </label>
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
}

export default ManageProfile;