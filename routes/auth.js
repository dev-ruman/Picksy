const app = require ('express');
const router = app.Router();
const authController = require('../controllers/auth');
const {body} = require('express-validator');

const userValidate = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long').isStrongPassword().withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    // body('street').notEmpty().withMessage('Street is required'),
    // body('city').notEmpty().withMessage('City is required'),
    // body('postalCode').notEmpty().withMessage('Postal code is required'),
    // body('country').notEmpty().withMessage('Country is required'),
    body('phone').isMobilePhone().withMessage('Please enter a valid phone number'),
]

router.post('/login', authController.login);
router.post('/register',userValidate, authController.register);
router.post('/verify-token', authController.verifyToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logout);

module.exports = router;