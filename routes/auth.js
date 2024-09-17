const router = require('express').Router();
const {verifyAdmin} = require('../utils/verifyToken')
const {loginUser, createUser, createEmployeeUser, logout, sendMailForResetPassword} = require('../controllers/auth.controller');

router.post('/login', loginUser);
router.post('/register', createUser);
router.post('/register-employee',verifyAdmin(4), createEmployeeUser);
router.post('/logout', logout)
router.post('/mail-to-reset', sendMailForResetPassword)




module.exports = router;



