const {getHospitalProfile,updateHospitalProfile} = require('../controllers/hospital')


const router = require('express').Router()

router.get("/hospitalProfile",getHospitalProfile)

router.put("/hospitalProfile",updateHospitalProfile)

module.exports  = router