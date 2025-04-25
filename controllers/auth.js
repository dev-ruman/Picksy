const {validationResult} = require('express-validator');
const {User} = require('../models/user');
const bcrypt = require('bcryptjs');
const JsonWebToken = require('jsonwebtoken');
const {Token} = require('../models/token');
require('dotenv/config');

exports.login = async function (req, res) {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({
                type: 'AuthError',
                message: 'User not found',
            });
        }
        if(!bcrypt.compareSync(password, user.passwordHash)){
            return res.status(400).json({
                type: 'AuthError',
                message: 'Incorrect password',
            });

        }

        const accessToken = JsonWebToken.sign(
        {id: user.id, isAdmin: user.isAdmin},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: '24h'}
        );
        const refreshToken = JsonWebToken.sign(
            {id: user.id},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: '60d'}
        );

        const token = await Token.findOne({userId: user.id});
        if(token) await token.deleteOne({userId: user.id});
        await new Token({
            userId: user.id,
            refreshToken,
            accessToken,
        }).save();

        user.passwordHash = undefined;
        return res.json({...user._doc, accessToken});
        
    } catch (error) {
        return res.status(500).json({
            type: error.name,
            message: error.message,
        })
        
    }
}
exports.register = async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => {
            return {field: error.path, message: error.msg};
        });
        return res.status(422).json({errors: errorMessages});
    }

    try {
        let user = new User({
            ...req.body,
            passwordHash: bcrypt.hashSync(req.body.password, 8),
        });
        user = await user.save();

        if (!user) {
            return res.status(500).json({
                type: 'InternalServerError',
                message: 'User registration failed',
            });
        }

        return res.status(201).json(user);

    } catch (error) {
        if(error.message.includes('email_1 dup key')){
            return res.status(409).json({
                type: 'AuthError',
                message: 'Email already exists',
            });
        }
        return res.status(500).json({
            type: error.name,
            message: error.message,
        })
    }
}
exports.verifyToken = async function (req, res) {
    try {
        let accessToken = req.headers.authorization;
        if(!accessToken) return res.json(false);
        accessToken = accessToken.replace('Bearer ', '');

        const token = await Token.findOne({accessToken});
        if(!token) return res.json(false);

        const tokenData = JsonWebToken.decode(token.refreshToken);

        const user = await User.findById(tokenData.id);
        if(!user) return res.json(false);

        const isValid = JsonWebToken.verify(token.refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if(!isValid) return res.json(false);
        return res.json(true);
        
    } catch (error) {
        return res.status(500).json({
            type: error.name,
            message: error.message,
        })
        
    }
}
exports.forgotPassword = async function (req, res) {}
exports.resetPassword = async function (req, res) {}
exports.verifyOtp = async function (req, res) {}
exports.logout = async function (req, res) {}