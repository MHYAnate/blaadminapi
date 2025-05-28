import prisma from "../prismaClient.js";

const earlyAccessHandler = async (req, res) => {
  const { name, location, email, phone } = req.body;

  try {
    // Validate required fields
    if (!name || !location || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingEmail = await prisma.earlyAccessTable.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create early access entry
    const earlyAccess = await prisma.earlyAccessTable.create({
      data: {
        name,
        location,
        email,
        phone,
      },
    });

    return res.status(201).json({ message: 'Early access signup successful', data: earlyAccess });
  } catch (error) {
    console.error('Early Access Error:', error);
    return res.status(500).json({ error: 'Failed to sign up for early access' });
  }
};



const newsletterHandler = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingEmail = await prisma.newsLetter.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }

    // Create newsletter entry
    const newsletter = await prisma.newsLetter.create({
      data: {
        email,
      },
    });

    return res.status(201).json({ message: 'Newsletter subscription successful', data: newsletter });
  } catch (error) {
    console.error('Newsletter Error:', error);
    return res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
};


const suggestCityHandler = async (req, res) => {
    const { city } = req.body;
  
    try {
      if (!city) {
        return res.status(400).json({ error: 'City is required' });
      }
  
      const suggestedCity = await prisma.suggestedCity.create({
        data: {
          cityName: city,  // Adjust to your actual Prisma model field name
        },
      });
  
      return res.status(201).json({ message: 'City suggestion submitted successfully', data: suggestedCity });
    } catch (error) {
      console.error('Suggest City Error:', error);
      return res.status(500).json({ error: 'Failed to submit city suggestion' });
    }
  };



  const contactUsHandler = async (req, res) => {
    const { name, email, message } = req.body;

    try {
      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }

      // Create contact message
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name,
          email,
          message,
        },
      });

      return res.status(201).json({ message: 'Message sent successfully', data: contactMessage });
    } catch (error) {
      console.error('Contact Us Error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  };


  const getUpdatesHandler = async (req, res) => {
    const { name, email } = req.body;

    try {
      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Check if email already exists
      const existingSubscriber = await prisma.updateSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        return res.status(409).json({ error: 'Email already subscribed' });
      }

      // Create subscriber
      const subscriber = await prisma.updateSubscriber.create({
        data: {
          name,
          email,
        },
      });

      return res.status(201).json({ message: 'Subscribed successfully', data: subscriber });
    } catch (error) {
      console.error('Get Updates Error:', error);
      return res.status(500).json({ error: 'Failed to subscribe' });
    }
  };


export { 
  earlyAccessHandler, 
  newsletterHandler, 
  suggestCityHandler,
  contactUsHandler,
  getUpdatesHandler
}