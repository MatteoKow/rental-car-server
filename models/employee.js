const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    id_account: {
        type: String,
        default: ""
    },
    active: {
        type: Boolean,
        default: true
    },
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
        default: ""
    },
    jobPosition: {
        type: String,
        default: ""
    },
    salary: {
        type: Number,
        default: 0
    },
    phone: {
        type: String,
        default: ""
    },
    typeDocument: {
        type: String,
        default: ""
    },
    idDocument: {
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
    code: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    dateOfEmployment: {
        type: Date,
        default: Date.now
    }

});

const Employee = mongoose.model('Employee', employeeSchema)

module.exports = Employee;