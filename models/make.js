const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const makeSchema = new Schema({
    name: {
        type: String,
    },
});


const Make = mongoose.model('Make', makeSchema)

module.exports = Make;