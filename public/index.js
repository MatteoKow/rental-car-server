const express = require('express'); 
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const SERVER_PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

const url = process.env.URL;

mongoose.connect(url)
  .then(() => {
    console.log(`MongoDB connected`);
  })
  .catch((error) => {
    console.error(`Error connecting to MongoDB: ${error}`);
  });

const usersRouter = require('../routes/users');
const authRouter = require('../routes/auth');
const carsRouter = require('../routes/cars')
const makesRouter = require('../routes/makes')
const bookingRouter = require('../routes/bookings');
const employeesRouter = require('../routes/employees');
const permissionsRouter = require('../routes/permissions');
const statisticsRouter = require('../routes/statistics');



app.use('/auth', authRouter); 
app.use('/users', usersRouter); 
app.use('/cars', carsRouter);
app.use('/makes', makesRouter);
app.use('/bookings', bookingRouter);  
app.use('/employees', employeesRouter);  
app.use('/permissions', permissionsRouter);  
app.use('/statistics', statisticsRouter);  



app.listen(SERVER_PORT, '127.0.0.1', () => console.log(`Server is listening on PORT ${SERVER_PORT}`)); 


module.exports = app;