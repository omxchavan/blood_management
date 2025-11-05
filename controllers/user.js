const { User } = require('../model/user');
const bcrypt = require('bcryptjs');

// Create a new user
async function addUser(req, res) {
  try {
    const { email, password, role } = req.body;
    console.log(email)
    // Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    // Check if role is valid
    const validRoles = ['donor', 'bloodbank', 'hospital', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getUsers(req, res) {
  try {
    const users = await User.find(); // await the query
    res.json(users); // now sends actual data
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {getUsers,addUser};