const Make = require('../models/make');

const getMakes = async (req, res) => {
    try {
        const makes = await Make.find();
        return res.send(makes);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }

};

module.exports = { getMakes };
