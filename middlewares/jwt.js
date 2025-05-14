const {expressjwt: expjwt} = require('express-jwt');
const {token} = require('../models/token');

function authJwt(){
    const API = process.env.API_PREFIX || '/api/v1';
    return expjwt({
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            `${API}/login`,
            `${API}/login/`,
            `${API}/register`,
            `${API}/register/`,
            `${API}/forgot-password`,
            `${API}/forgot-password/`,
            `${API}/verify-otp`,
            `${API}/verify-otp/`,
            `${API}/reset-password`,
            `${API}/reset-password/`,
            `${API}/verify-token`,
            `${API}/verify-token/`
        ]
    });

    async function isRevoked(req, jwt) {
        const authHeader = req.header('Authorization');

        if (!authHeader.startsWith('Bearer ')) {
            return true; 
        }

        const accesToken = authHeader.replace('Bearer ', '').trim();
        const token = await token.findOne({accesToken});

        const adminRouteRegex = /^\/api\/v1\/admin\//i;
        adminFault = !jwt.payload.isAdmin && adminRouteRegex.test(req.originalUrl);

        return !token || adminFault;
    }
}

module.exports = authJwt;