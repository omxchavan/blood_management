require('dotenv').config();
const mongoose = require('mongoose');
const { bloodBank } = require('./model/bloodBank'); // adjust path if needed

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'))
  .catch((err) => console.error('DB connection error:', err));

// Sample blood banks data
const bloodBanks = [
  {
    name: 'City Blood Bank',
    registrationNumber: 'BB12345',
    phone: '1234567890',
    email: 'contact@citybloodbank.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      pincode: '10001',
      coordinates: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    inventory: [
      { bloodGroup: 'A+', quantity: 10 },
      { bloodGroup: 'O+', quantity: 20 },
      { bloodGroup: 'B+', quantity: 5 },
    ],
    operatingHours: { open: '08:00', close: '18:00' },
    isVerified: true,
  },
  {
    name: 'Metro Blood Center',
    registrationNumber: 'BB67890',
    phone: '9876543210',
    email: 'info@metroblood.com',
    address: {
      street: '456 Oak St',
      city: 'Los Angeles',
      state: 'CA',
      pincode: '90001',
      coordinates: {
        lat: 34.0522,
        lng: -118.2437,
      },
    },
    inventory: [
      { bloodGroup: 'AB+', quantity: 15 },
      { bloodGroup: 'O-', quantity: 8 },
      { bloodGroup: 'B-', quantity: 12 },
    ],
    operatingHours: { open: '09:00', close: '17:00' },
    isVerified: false,
  },
];

// Seed function
async function seedBloodBanks() {
  try {
    // Optional: Clear existing collection
    await bloodBank.deleteMany({});
    const result = await bloodBank.insertMany(bloodBanks);
    console.log('Blood banks added:', result);
  } catch (err) {
    console.error('Error adding blood banks:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedBloodBanks();
