const router = require('express').Router();
const {getPermissions, addPermissions, deletePermission}  = require('../controllers/permissions.controller');
const {verifyAdmin} = require('../utils/verifyToken')

router.get('/', verifyAdmin(4), getPermissions);
router.post('/add', verifyAdmin(4), addPermissions);
router.delete('/:id', verifyAdmin(4), deletePermission);




module.exports = router;