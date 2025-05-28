import express from 'express';
import sendEmail from '../mailer.js';

const testRouter = express.Router();

testRouter.post('/', async (req, res) => {
  const email = "babajide234@gmail.com";
  
  try {
    await sendEmail(email, 'Welcome to Our Platform', 'welcome', {
      name: "Babajide Tomoshegbo",
    });
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).send('Failed to send email');
  }
});

export default testRouter;