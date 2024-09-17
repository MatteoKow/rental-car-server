const router = require('express').Router();
const {addBooking, addReview, deleteReview, blockReview, activateReview, cancelBookingById, getBookingsById, getAllBookings, getBookingById, getCompletedBookings, getWaitingBookings, getWaitingBookingsById, getCanceledBookings, getCompletedBookingsByIdReview, getBookingsWithReviewById, getCompletedBookingsById, getCanceledBookingsById, getLastThreeReviews, getReviews, getBlockedReviews, confirmBookingById}  = require('../controllers/bookings.controller');
const { verifyAdmin, verifyUser } = require('../utils/verifyToken');

router.get('/', verifyAdmin(3), getAllBookings);
router.get('/reviews', verifyAdmin(3), getReviews);
router.get('/blocked-reviews', verifyAdmin(3), getBlockedReviews);

router.get('/last-reviews', getLastThreeReviews);


router.get('/completed', verifyAdmin(3), getCompletedBookings);
router.get('/waiting', verifyAdmin(3), getWaitingBookings);
router.get('/canceled', verifyAdmin(3), getCanceledBookings);

router.post('/add', addBooking);
router.patch('/add-review/:id', verifyUser, addReview);
router.patch('/delete-review/:id', verifyUser, deleteReview);



router.patch('/block-review/:id', verifyAdmin(3), blockReview);
router.patch('/activate-review/:id', verifyAdmin(3), activateReview);
router.patch('/confirm/:id', verifyAdmin(3), confirmBookingById);

router.get('/user/:id', verifyUser, getBookingsById); 
router.get('/user/completed/review/:id', verifyUser, getCompletedBookingsByIdReview); 

router.get('/user/completed/:id', verifyUser, getCompletedBookingsById); 
router.get('/user/waiting/:id', verifyUser, getWaitingBookingsById); 
router.get('/user/canceled/:id', verifyUser, getCanceledBookingsById); 

router.get('/user/review/:id', verifyUser, getBookingsWithReviewById); 
 

router.post('/:id', verifyUser, getBookingById); 
router.patch('/:id', verifyUser, cancelBookingById);
 



 




module.exports = router;