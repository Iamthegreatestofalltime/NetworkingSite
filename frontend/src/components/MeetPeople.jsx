import React from "react";

function MeetPeople () {
    return(
        <div>
            <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            <p>
                Meet People
            </p>
        </div>
    );
}

export default MeetPeople;