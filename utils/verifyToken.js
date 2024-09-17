const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization; 
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = user;
        next();
    } catch {
        return res.status(401).send({ message: 'Authentication failed. You are not authenticated.', code: 401 });
    }
}

const verifyUser = (req, res, next) => {

    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.role.some(role => role > 1)) {
            next();
        } else {
            return res.status(401).send({ message: 'Authorization failed. You are not authorized to access this resource.', code: 401 });
        }
    });
}

const verifyAdmin = (requiredRole) => (req, res, next) => {
    verifyToken(req, res, () => {
        if ((req.user.role).includes(requiredRole)) {
            next();
        } else {
            return res.status(401).send({ message: 'Authorization failed. You are not authorized to access this resource.', code: 401 });
        }
    });
}

module.exports = { verifyUser, verifyAdmin };
