import React, { useState } from "react";

function CreateCommunity () {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:5000/createCommunity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // Assuming you store token in localStorage
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();
        if (data.communityId) {
            // Community created successfully
            console.log('Community created:', data.communityId);
        } else {
            // Handle error
            console.error(data.error);
        }
    };

    return (
        <div>
            <p>Create community</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Community Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <button type="submit">Create</button>
            </form>
        </div>
    );
}

export default CreateCommunity;