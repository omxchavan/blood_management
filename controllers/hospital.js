const { Hospital } = require("../model/hospital");

const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports={getHospitalProfile,updateHospitalProfile}

