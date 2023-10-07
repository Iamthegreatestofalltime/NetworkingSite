import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "./UserContext.jsx";

export default function RegisterAndLoginForm() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  // For error handling
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const [email, setEmail] = useState('');
    const { setUsername: setLoggedInUsername, setId, setToken } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = isLoginOrRegister === 'register' 
        ? { username, password, email }  // include email in the payload for registration
        : { username, password };  // keep as is for login

        const url = isLoginOrRegister === 'register' 
            ? 'http://localhost:5000/register' 
            : 'http://localhost:5000/login';

        try {
            console.log(payload);  // Debugging line
            const response = await axios.post(url, payload);

            
            if (response && response.data) {
                if (isLoginOrRegister === 'login' && response.data.token) {
                    setToken(response.data.token);
                    localStorage.setItem("authToken", response.data.token);
                    setLoggedInUsername(username);
                    setId(response.data.id);  // This sets userId in context, but not in localStorage
                    localStorage.setItem('userId', response.data.userId);  // Save userId to localStorage for later use
                    navigate("/home");
                } else if (isLoginOrRegister === 'register') {
                    // Handle registration response, e.g. display a confirmation message or auto-login the user.
                    setIsLoginOrRegister('login');  // Switch to login after successful registration
                }
            } else {
                setError("Unexpected server response. Please try again.");
            }
    
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    }

    return(
        <div className="loginpage bg-blue-500 flex items-center justify-center min-h-screen p-3 sm:p-0">
            <form onSubmit={handleSubmit} className="bg-blue-400 p-8 rounded-lg w-full sm:w-auto">
                <div className="logindivstuff">
                    {isLoginOrRegister === 'register' && (
                        <div>
                            <h1 className="loginregistertitletext text-2xl font-bold mb-4">Register</h1>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            <h1 className="loginregistertitletext text-2xl font-bold mb-4">Login</h1>
                        </div>
                    )}
                    <input value={username}
                        className="UsernameField w-full p-2 mb-4 border rounded"
                        onChange={e => setUsername(e.target.value)}
                        type="text"
                        placeholder="Username"
                    />
                    {isLoginOrRegister === 'register' && (
                        <input value={email}
                            className="emailfieldregister w-full p-2 mb-4 border rounded"
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                            placeholder="Email"
                            required
                        />
                    )}
                    <input value={password}
                        className="passwordfieldregister w-full p-2 mb-4 border rounded"
                        type="password"
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                    <button className="registerloginbutton w-full p-2 bg-blue-700 rounded text-white">
                        {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                    </button>
                    <div className="registerswitchloginstuff mt-4">
                        {isLoginOrRegister === 'register' && (
                            <div>
                                Already a member?
                                <button className="switchbutton text-blue-700 ml-2" onClick={() => setIsLoginOrRegister('login')}>
                                    Login here
                                </button>
                            </div>
                        )}
                        {isLoginOrRegister === 'login' && (
                            <div>
                                Don't have an account?
                                <button className="switchbutton text-blue-700 ml-2" onClick={() => setIsLoginOrRegister('register')}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}