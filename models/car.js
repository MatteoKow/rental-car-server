const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const carSchema = new Schema({
    make_id: {
        type: ObjectId,
    },
    active: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    typeCar: {
        type: String,
    },
    year: {
        type: Number,
    },
    fuel: {
        type: String,
    },
    horsepower: {
        type: Number, 
    },
    color: {
        type: String,
    },
    transmission: {
        type: String,
    },
    engine: {
        type: Number,
    },
    doors: {
        type: Number,
    },
    ac: {
        type: String, 
    },
    image: {
        type: Array,
        required: true,
    },
    quantity: {
        type: Number, 
        default: 0
    },
});


const Car = mongoose.model('Car', carSchema)

module.exports = Car;