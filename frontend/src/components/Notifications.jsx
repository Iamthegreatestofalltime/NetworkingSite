import React from "react";

function Notifications () {
    return (
        <div>
            <button onClick={() => window.history.back()} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                Back
            </button>
            <p>Notifications Page</p>
        </div>
    );
}

export default Notifications;