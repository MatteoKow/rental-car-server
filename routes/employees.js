const router = require('express').Router();
const {addEmployee, getEmployees, getEmployeeById, getInactiveEmployees, getEmployeesWithoutAccount, updateEmployee, archiveEmployee, activateEmployee} = require('../controllers/employees.controller');
const {verifyAdmin} = require('../utils/verifyToken')

router.patch('/update/archive-employee/:id', verifyAdmin(4), archiveEmployee);
router.patch('/update/activate/:id', verifyAdmin(4), activateEmployee);
router.put('/update/:id', verifyAdmin(4), updateEmployee);
router.get('/employees-without-account', verifyAdmin(4), getEmployeesWithoutAccount);
router.get('/inactive', verifyAdmin(4), getInactiveEmployees);
router.get('/:id', verifyAdmin(4), getEmployeeById);
router.get('/', verifyAdmin(4), getEmployees);

router.post('/add', verifyAdmin(4), addEmployee);





module.exports = router;



