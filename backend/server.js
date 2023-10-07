const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');

const JWT_SECRET = 'someRandomSecret';

mongoose.connect('mongodb+srv://alexlotkov124:Cupworld1@cluster0.0j1higg.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected ...');
}).catch(err => console.error(err.message));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true } ,
    password: { type: String, required: true } ,
    email: { type: String, required: true },
    profilePicture: { type: String, default: 'https://wvnpa.org/content/uploads/blank-profile-picture-973460_1280-768x768.png' },
    bio: { type: String, default: '' },
    interests: { type: String, default: '' },
    age: { type: Number, default: null }
});

const User = mongoose.model('User', UserSchema);

const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.json());

const PostSchema = new mongoose.Schema({
    content: { type: String, required: true },
    pictures: [{ type: String }],
    hashtags: [{ type: String }],  // Add this line to store hashtags
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' }
});

const Post = mongoose.model('Post', PostSchema);

const CommentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    timestamp: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', CommentSchema);

const ConnectionSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'connected', 'rejected'], default: 'pending' }
});

const Connection = mongoose.model('Connection', ConnectionSchema);

const CommunitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Community = mongoose.model('Community', CommunitySchema);

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

app.use(cors({ origin: 'https://connectedfuture-cdda69487455.herokuapp.com/', credentials: true}));
app.use(express.json());

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    const emailExists = await User.findOne({ email });

    if (emailExists) {
        return res.status(400).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        username,
        password: hashedPassword,
        email
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '6h' });

    res.status(201).json({ 
        message: 'User registered.', 
        token,
        userId: user._id
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
        message: 'Logged in successfully.',
        token,                // equivalent to token: token
        userId: user._id      // sending user ID
    });
});

app.post('/post', upload.array('pictures', 5), async (req, res) => {
    const { content, userId, hashtags } = req.body;

    if (!userId || !content) {
        return res.status(400).send({ error: 'User ID and Content are required.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }

        const post = new Post({
            content: content,
            pictures: req.files.map(file => `/uploads/${file.filename}`),
            hashtags: hashtags.split(',').map(tag => tag.trim()),  // Split hashtags by comma and trim whitespace
            user: userId,
        });

        await post.save();

        res.send({ message: 'Post created', postId: post._id });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Serve images from the uploads directory
app.use('/uploads', express.static('uploads'));

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'username profilePicture');
        const postsWithBase64Images = await Promise.all(posts.map(async post => {
            const base64Images = await Promise.all(post.pictures.map(async picturePath => {
                const absolutePath = path.join(__dirname, picturePath);
                const data = await fs.promises.readFile(absolutePath);
                return data.toString('base64');
            }));
            return {
                ...post._doc,
                pictures: base64Images,
            };
        }));
        res.status(200).json(postsWithBase64Images);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, async (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            try {
                const userInfo = await User.findById(user.id).select('-password');
                req.user = userInfo;
                next();
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'An error occurred while processing your request.' });
            }
        });
    } else {
        res.sendStatus(401);
    }
};

app.get('/api/user', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');  // Exclude password from the result
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        // Read profile picture file, convert to Base64, and include in response
        if (user.profilePicture.startsWith('/uploads/')) {
            const absolutePath = path.join(__dirname, user.profilePicture);
            const data = await fs.promises.readFile(absolutePath);
            user.profilePicture = `data:image/png;base64,${data.toString('base64')}`;
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/updateProfile', authenticateJWT, upload.single('profilePicture'), async (req, res) => {
    const { bio, interests, age } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : req.user.profilePicture;

    try {
        const profilePicture = req.file ? `/uploads/${req.file.filename}` : req.user.profilePicture;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { bio, interests, age, profilePicture },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/comment', authenticateJWT, async (req, res) => {
    const { content, postId } = req.body;

    if (!content || !postId) {
        return res.status(400).send({ error: 'Content and Post ID are required.' });
    }

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send({ error: 'Post not found.' });
        }

        const comment = new Comment({
            content,
            user: req.user._id,
            post: postId,
        });

        await comment.save();

        res.send({ message: 'Comment created', commentId: comment._id });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/comments/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const comments = await Comment.find({ post: postId }).populate('user', 'username');
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/api/posts/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const posts = await Post.find({ user: userId }).populate('user', 'username');
        const postsWithBase64Images = await Promise.all(posts.map(async post => {
            const base64Images = await Promise.all(post.pictures.map(async picturePath => {
                const absolutePath = path.join(__dirname, picturePath);
                const data = await fs.promises.readFile(absolutePath);
                return data.toString('base64');
            }));
            return {
                ...post._doc,
                pictures: base64Images,
            };
        }));
        res.status(200).json(postsWithBase64Images);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).select('-password');  // Exclude password from the result
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        // Read profile picture file, convert to Base64, and include in response
        if (user.profilePicture.startsWith('/uploads/')) {
            const absolutePath = path.join(__dirname, user.profilePicture);
            const data = await fs.promises.readFile(absolutePath);
            user.profilePicture = `data:image/png;base64,${data.toString('base64')}`;
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

async function deletePost(postId) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/post/${postId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('userId')}`,  // Use userId as token
            }
        });
        
        // Check for successful deletion
        if (response.status === 200) {
            const newPosts = posts.filter(post => post._id !== postId);
            setPosts(newPosts);
        } else {
            throw new Error(response.data.error || 'An error occurred while deleting the post.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

app.delete('/api/post/:postId', authenticateJWT, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/api/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }

    try {
        const regexQuery = new RegExp(query, 'i');  // Case insensitive search
        
        // Search for posts
        const posts = await Post.find({
            $or: [
                { content: regexQuery },
                { hashtags: { $in: [regexQuery] } }
            ]
        }).populate('user', 'username profilePicture');
        
        // Convert image files to Base64 format for posts
        const postsWithBase64Images = await Promise.all(posts.map(async post => {
            const base64Images = await Promise.all(post.pictures.map(async picturePath => {
                const absolutePath = path.join(__dirname, picturePath);
                const data = await fs.promises.readFile(absolutePath);
                return data.toString('base64');
            }));
            return {
                ...post._doc,
                pictures: base64Images,
            };
        }));
        
        const users = await User.find({
            $or: [
                { username: regexQuery },
                { bio: regexQuery },
                { interests: regexQuery }
            ]
        }).select('username profilePicture _id interests');     
        
        // Convert image files to Base64 format for users
        const usersWithBase64Images = await Promise.all(users.map(async user => {
            const absolutePath = path.join(__dirname, user.profilePicture);
            const data = await fs.promises.readFile(absolutePath);
            const profilePictureBase64 = data.toString('base64');
            return {
                ...user._doc,
                profilePicture: `data:image/jpeg;base64,${profilePictureBase64}`
            };
        }));

        const communities = await Community.find({
            $or: [
                { name: regexQuery },
                { description: regexQuery }
            ]
        });

        res.status(200).json({ posts: postsWithBase64Images, users: usersWithBase64Images, communities });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/connection/request', authenticateJWT, async (req, res) => {
    const { receiverId } = req.body;
    try {
        const existingConnection = await Connection.findOne({
            $or: [
                { requester: req.user._id, receiver: receiverId },
                { requester: receiverId, receiver: req.user._id }
            ]
        });
        
        if (existingConnection) {
            return res.status(400).json({ message: 'Connection already exists.' });
        }

        const connection = new Connection({
            requester: req.user._id,
            receiver: receiverId,
            status: 'pending'
        });
        
        await connection.save();
        res.status(200).json({ message: 'Connection request sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Accept Connection Request
app.post('/connection/accept', authenticateJWT, async (req, res) => {
    const { connectionId } = req.body;
    try {
        const connection = await Connection.findByIdAndUpdate(connectionId, { status: 'connected' }, { new: true });
        res.status(200).json(connection);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/connection/status', authenticateJWT, async (req, res) => {
    const { user1Id, user2Id } = req.query;

    try {
        const connection = await Connection.findOne({
            $or: [
                { requester: user1Id, receiver: user2Id },
                { requester: user2Id, receiver: user1Id }
            ]
        }).lean();
        
        if (connection) {
            if (connection.requester.toString() === user1Id) {
                res.status(200).json({ status: connection.status });
            } else {
                res.status(200).json({ status: 'no connection' });
            }
        } else {
            res.status(200).json({ status: 'no connection' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Deny Connection Request
app.post('/connection/deny', authenticateJWT, async (req, res) => {
    const { connectionId } = req.body;
    try {
        const connection = await Connection.findByIdAndUpdate(connectionId, { status: 'rejected' }, { new: true });
        res.status(200).json(connection);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/connections', authenticateJWT, async (req, res) => {
    try {
        const connections = await Connection.find({
            $or: [{ requester: req.user._id, status: 'connected' }, { receiver: req.user._id, status: 'connected' }]
        }).populate('requester', 'username _id').populate('receiver', 'username _id');
        res.status(200).json(connections);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Remove Connection
app.post('/connection/remove', authenticateJWT, async (req, res) => {
    const { receiverId } = req.body;
    try {
        await Connection.findOneAndDelete({
            $or: [
                { requester: req.user._id, receiver: receiverId },
                { requester: receiverId, receiver: req.user._id }
            ]
        });
        res.status(200).json({ message: 'Connection removed.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/createCommunity', authenticateJWT, async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required.' });
    }

    const community = new Community({
        name,
        description,
        admin: req.user._id,
        members: [req.user._id]  // Admin is the first member
    });

    await community.save();
    res.status(201).json({ message: 'Community created', communityId: community._id });
});

app.get('/api/myCommunities', authenticateJWT, async (req, res) => {
    try {
        const communities = await Community.find({ members: req.user._id });
        res.status(200).json(communities);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Server-side: Adjusting the route to populate member usernames
app.get('/api/community/:communityId', async (req, res) => {
    const { communityId } = req.params;
    try {
        const community = await Community.findById(communityId)
            .populate('admin', 'username')
            .populate('members', 'username');  // Populating member usernames here
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' });
        }
        res.status(200).json(community);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Join a Community
app.post('/api/community/:communityId/join', authenticateJWT, async (req, res) => {
    const { communityId } = req.params;
    try {
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' });
        }
        if (community.members.includes(req.user._id)) {
            return res.status(400).json({ error: 'Already a member.' });
        }
        community.members.push(req.user._id);
        await community.save();
        res.status(200).json({ message: 'Joined community' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Leave a Community
app.post('/api/community/:communityId/leave', authenticateJWT, async (req, res) => {
    const { communityId } = req.params;
    try {
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ error: 'Community not found.' });
        }
        if (!community.members.includes(req.user._id)) {
            return res.status(400).json({ error: 'Not a member.' });
        }
        community.members.pull(req.user._id);
        await community.save();
        res.status(200).json({ message: 'Left community' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/community/:communityId/post', upload.array('pictures', 5), async (req, res) => {
    const { content, userId, hashtags } = req.body;
    const { communityId } = req.params;

    if (!userId || !content) {
        return res.status(400).send({ error: 'User ID and Content are required.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }

        const post = new Post({
            content: content,
            pictures: req.files.map(file => `/uploads/${file.filename}`),
            hashtags: hashtags.split(',').map(tag => tag.trim()),
            user: userId,
            community: communityId  // Set the community field
        });

        await post.save();

        res.send({ message: 'Post created', postId: post._id });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/community/:communityId/posts', async (req, res) => {
    const { communityId } = req.params;
    
    try {
        const posts = await Post.find({ community: communityId }).populate('user', 'username profilePicture');
        const postsWithBase64Images = await Promise.all(posts.map(async post => {
            const base64Images = await Promise.all(post.pictures.map(async picturePath => {
                const absolutePath = path.join(__dirname, picturePath);
                const data = await fs.promises.readFile(absolutePath);
                return data.toString('base64');
            }));
            return {
                ...post._doc,
                pictures: base64Images,
            };
        }));
        res.status(200).json(postsWithBase64Images);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

// Send a message
app.post('/send-message', authenticateJWT, async (req, res) => {
    const { receiverId, content } = req.body;
    const message = new Message({
        sender: req.user._id,
        receiver: receiverId,
        content
    });
    await message.save();
    res.status(200).json({ message: 'Message sent.' });
});

app.get('/messages/:userId', authenticateJWT, async (req, res) => {
    const { userId } = req.params;
    const messages = await Message.find({
        $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id }
        ]
    })
    .sort('timestamp')
    .populate('sender', 'username');  // Populate sender's username
    res.status(200).json(messages);
});

app.use(express.static('../frontend/build'));
    
    // Catch-all route handler
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"),
    function(err) {
        if(err) {
            res.status(500).send(err);
        }
    }
    );
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});