const { ObjectId } = require('bson');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: String,
    },
    phone: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: null
    },
    drivingLicense: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    zipCode: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    role: {
        type: Array,
        default: 1
    },
    favourites: {
        type: Array
    },
});

const User = mongoose.model('User', userSchema)

module.exports = User;