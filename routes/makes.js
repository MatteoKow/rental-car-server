const router = require('express').Router();
const {getMakes}  = require('../controllers/makes.controller');

router.get('/', getMakes);


module.exports = router;