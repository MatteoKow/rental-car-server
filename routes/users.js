const router = require('express').Router();
const {getUsers, getUser, getEmployeesAccount, getEmployeeAccountById, updateUser, updateEmployeeUser, changePassword, deleteUser, getFavouritesById, addFavourites, getFavouritesCars, resetPassword} = require('../controllers/users.controller');
const {verifyUser, verifyAdmin} = require('../utils/verifyToken')

router.get('/', verifyAdmin(4), getUsers);
router.get('/employees', verifyAdmin(4), getEmployeesAccount);
router.get('/employee/:id',verifyAdmin(4), getEmployeeAccountById);
router.patch('/update/employee/:id', verifyAdmin(4), updateEmployeeUser);
router.get('/favourites/user/:id', verifyUser, getFavouritesCars);
router.patch('/update/password/:id', verifyUser, changePassword);
router.patch('/update/reset', resetPassword);
router.put('/update/:id', verifyUser, updateUser);
router.get('/favourites/:id', verifyUser, getFavouritesById);
router.patch('/favourites/:id', verifyUser, addFavourites);

router.get('/:id', verifyUser, getUser);


router.delete('/:id', deleteUser);
// router.post('/add', createUser);






module.exports = router;



