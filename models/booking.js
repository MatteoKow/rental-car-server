const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    clientId: {
        type: ObjectId,
    },
    carId: {
        type: ObjectId,
    },
    totalPrice: {
        type: Number,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    review: {
        blocked: {
            type: Boolean,
            default: false,
        },
        added: {
            type: Boolean,
            default: false,
        },
        text: {
            type: String,
            default: "",
        },
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    drivingLicense: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    zipCode: {
        type: String,
    },
    country: {
        type: String,
    },
    rentalPrice: {
        type: Number,
    },
    extrasPrice: {
        type: Number,
    },
    extras: {
        type: Object,
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "waiting"
    },


});


const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking;