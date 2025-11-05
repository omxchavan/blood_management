const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // _id is automatically created by MongoDB
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['donor', 'bloodbank', 'hospital', 'admin'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// model for database
const User = mongoose.model("users", userSchema);

module.exports = {
  User,
};
