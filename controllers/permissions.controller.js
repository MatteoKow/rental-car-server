const Permission = require('../models/permission');

const getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find();
        return res.send(permissions);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }

};

const addPermissions = async (req, res) => {
    try {
        const newPermission = new Permission({
            name: req.body.name,
            roles: req.body.roles
        });
        
        await newPermission.save();

        return res.status(201).json({ message: 'Uprawnienie zostało dodane' });
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }

};

const deletePermission = async (req, res) => {
    try {
        const permission = await Permission.findByIdAndDelete(req.params.id);  
        return res.json("Permission deleted");
    } catch (error) {
        return res.status(500).send({ message: 'Wystąpił błąd aplikacji', code: 500 });
    }

};



module.exports = { getPermissions, addPermissions, deletePermission};
