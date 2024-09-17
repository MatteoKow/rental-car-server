const router = require('express').Router();
const { addCar, getCars, getCarById, getCarsFiltered, getInactiveCars, updateCarById, deactivateCar, activateCar} = require('../controllers/cars.controller');
const upload = require('../utils/upload');

router.get('/', getCars);
router.get('/inactive', getInactiveCars);

router.get('/:id', getCarById);
router.put('/:id', upload.array('carImages'), updateCarById);
router.patch('/deactivate/:id', deactivateCar);
router.patch('/activate/:id', activateCar);


router.post('/filter', getCarsFiltered);


router.post('/add', upload.array('carImages'), addCar);

module.exports = router;