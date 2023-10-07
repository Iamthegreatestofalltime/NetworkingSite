import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import RegisterAndLoginForm from './components/RegisterAndLoginForm';
import { UserProvider } from './components/UserContext';
import Post from './components/Post';
import CommunityPage from './components/CommunityPage';
import Search from './components/Search';
import CreateCommunity from './components/CreateCommunity';
import ProfilePage from './components/ProfilePage';
import Message from './components/Message';
import Connections from './components/Connections';
import Comments from './components/Comments';
import ManagePost from './components/ManagePost';
import ManageProfile from './components/ManageProfile';
import MeetPeople from './components/MeetPeople';
import MyCommunities from './components/MyCommunities';
import Notifications from './components/Notifications';

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
            <Route path="/login" element={<RegisterAndLoginForm />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<RegisterAndLoginForm />} />
            <Route path='/post' element={<Post />} />
            <Route path="/community/:communityId" element={<CommunityPage />} />
            <Route path='/search' element={<Search />} />
            <Route path='/createcommunity' element={<CreateCommunity /> } />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/message/:userId" element={<Message />} />
            <Route path='/connections' element={<Connections />} />
            <Route path='/comments' element={<Comments />} />
            <Route path='/managepost' element={<ManagePost /> } />
            <Route path='/manageprofile' element={<ManageProfile />} />
            <Route path='/meetpeople' element={<MeetPeople />} />
            <Route path='/mycommunities' element={<MyCommunities />} />
            <Route path='/notifications' element={<Notifications />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
