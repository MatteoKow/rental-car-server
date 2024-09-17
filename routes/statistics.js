const router = require('express').Router();
const { getStats }  = require('../controllers/statistics.controller');
const { verifyAdmin } = require('../utils/verifyToken');


router.post('/', verifyAdmin(5), getStats);


module.exports = router;