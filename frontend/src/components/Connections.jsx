import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

function Connections() {
    const [connections, setConnections] = useState([]);
    
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if(authToken) {
            axios.get('http://localhost:5000/connections', { 
                headers: { Authorization: `Bearer ${authToken}` } 
            })
            .then(response => {
                setConnections(response.data);
            })
            .catch(error => {
                console.error('Error fetching connections:', error);
            });
        }
    }, []);
    
    return (
        <div className="bg-white rounded-md min-h-screen p-6">
            <div className="md:hidden mb-4">  {/* This div will only be displayed on mobile */}
                <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Back
                </button>
            </div>
            <p className="text-xl font-bold mb-4">Connections</p>
            <div className="space-y-4">
                {connections.map((connection, index) => {
                    const connectedUser = connection.requester._id === localStorage.getItem('userId') ? connection.receiver : connection.requester;
                    return (
                        <Link key={index} to={`/profile/${connectedUser._id}`} className="block bg-white p-4 rounded shadow">
                            {connectedUser.username}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default Connections;
