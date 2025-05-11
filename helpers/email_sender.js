const nodemailer = require('nodemailer');
require('dotenv/config');


exports.sendEmail = async (email, subject, body) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            text: body,
        };
        transporter.sendMail(mailOptions, (error, info) =>{
            if (error) {
                console.log(error);
                reject(Error(error.message));
            }
            resolve('Password reset OTP sent to your email');
        });
    })

}