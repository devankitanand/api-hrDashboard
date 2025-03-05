const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define a schema for the profile
const profileSchema = new mongoose.Schema({
  name: String,
  profilePic: String
});

const Profile = mongoose.model('Profile', profileSchema);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Endpoint to update the profile
app.post('/updateProfile', upload.single('profilePic'), async (req, res) => {
  try {
    const { name } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    const update = {
      ...(name && { name }),
      ...(profilePic && { profilePic })
    };

    console.log('Update object:', update);

    const profile = await Profile.findOneAndUpdate({}, update, { new: true, upsert: true });
    console.log('Profile updated:', profile);
    res.json(profile);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send({ message: 'Error updating profile', error: err });
  }
});

// Endpoint to get the profile
app.get('/profile', async (req, res) => {
  try {
    const profile = await Profile.findOne({});
    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).send({ message: 'Error fetching profile', error: err });
  }
});

// Serve the uploaded files
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
