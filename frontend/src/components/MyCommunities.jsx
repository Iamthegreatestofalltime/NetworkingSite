import React, { useEffect, useState } from "react";
import {Link} from 'react-router-dom';

function MyCommunities () {
    const [communities, setCommunities] = useState([]);

    useEffect(() => {
        const fetchCommunities = async () => {
            const response = await fetch('http://localhost:5000/api/myCommunities', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // Assuming you store token in localStorage
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                setCommunities(data);  // Directly set the data as it's an array of communities
            } else {
                console.error('Failed to fetch communities:', response.statusText);
            }
        };
    
        fetchCommunities();
    }, []);    

    return (
        <div>
            <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            <Link to="/createcommunity">
                <button className="bg-blue-600 text-white h-10 rounded-md">
                    Create a Community
                </button>
            </Link>
            <p>
                My Communities page
            </p>
            <ul>
                {communities.map(community => (
                    <li key={community._id}>
                        <Link to={`/community/${community._id}`}>{community.name}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default MyCommunities;