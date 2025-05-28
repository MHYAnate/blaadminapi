// import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import prisma from './prismaClient.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import crypto from 'crypto';
import { URL } from 'url';
import dotenv from 'dotenv';
dotenv.config();


export const generateVerificationCode = async (userId) => {

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // const code = "123456";

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Store in the database (overwrite any existing active codes)
  await prisma.verificationCode.upsert({
    where: { 
      userId 
    },
    update: { code, expiresAt, createdAt: new Date() },
    create: { userId, code, expiresAt },
  });

  return code;
};


export const verifyCode = async (userId, inputCode) => {
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code: inputCode,
        expiresAt: { gte: new Date() },
      },
    });
  
    if (!verificationCode) {
      throw new Error("Invalid or expired verification code");
    }
  
    // Mark user as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  
    return true;
};
  

export const sendVerificationEmail = async (email, verificationCode) => {
  
  try {
    // const emailHtml = await render(<VerificationEmail verificationCode={verificationCode} />);
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev', 
    //   to: email,
    //   subject: 'Verify Your Email',
    //   html: '<strong>It works!</strong>',
    // });

    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};


export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message:{message: 'Too many login attempts. Please try again later.'},
});


export const upload = multer({ 
    storage: multer.memoryStorage() 
}); 


export const response = ({ res, status, message, data }) => {
  if (!res) {
      throw new Error("Res object is undefined in response function");
  }
  return res.status(status).json({ message, data });
};


export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function paginate({ model, page, limit, where, include, orderBy }) {
  const total = await model.count({ where });
  const data = await model.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where,
    include,
    orderBy
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}


// Generate a signed URL for admin invitation
export const generateAdminInviteUrl = (email, userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', process.env.INVITE_SECRET)
    .update(`${email}-${userId}-${expiresAt.getTime()}`)
    .digest('hex');
  
  const url = new URL(`${process.env.FRONTEND_URL}/admin/register`);
  url.searchParams.set('email', email);
  url.searchParams.set('userId', userId);
  url.searchParams.set('expires', expiresAt.getTime());
  url.searchParams.set('signature', signature);
  
  return { url: url.toString(), token, expiresAt };
};

  // Verify signed URL
  export const verifySignedUrl = (req) => {
    const { email, userId, expires, signature } = req.query;
    
    // Check if all required params exist
    if (!email || !userId || !expires || !signature) {
      return { valid: false, error: 'Missing required parameters' };
    }
    
    // Check if URL expired
    if (Date.now() > parseInt(expires)) {
      return { valid: false, error: 'URL has expired' };
    }
    
    // Recreate signature to verify
    const expectedSignature = crypto
      .createHmac('sha256', process.env.INVITE_SECRET)
      .update(`${email}-${userId}-${expires}`)
      .digest('hex');
      
    return {
      valid: signature === expectedSignature,
      email,
      userId: parseInt(userId),
      error: signature === expectedSignature ? null : 'Invalid signature'
    };
  };


  // Helper function
  export const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  }

  export const processReferral = async(referralCode, refereeId, refereeEmail) => {
    // Find the referring user
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true }
    });
  
    if (!referrer) {
      throw new Error('Invalid referral code');
    }
  
    // Create the referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        refereeEmail,
        referralCode,
      }
    });
  
    // Free shipping bonus expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
  
    // Create bonuses for both users in a transaction
    await prisma.$transaction([
      // Bonus for referrer
      prisma.referralBonus.create({
        data: {
          userId: referrer.id,
          bonusType: 'FREE_SHIPPING',
          expiresAt,
          referralId: referral.id
        }
      }),
      
      // Bonus for referee
      prisma.referralBonus.create({
        data: {
          userId: refereeId,
          bonusType: 'FREE_SHIPPING',
          expiresAt,
          referralId: referral.id
        }
      }),
      
      // Update both users to have free shipping
      prisma.user.update({
        where: { id: referrer.id },
        data: { hasFreeShipping: true }
      }),
      
      prisma.user.update({
        where: { id: refereeId },
        data: { hasFreeShipping: true }
      }),
      
      // Mark referral as completed
      prisma.referral.update({
        where: { id: referral.id },
        data: { isCompleted: true }
      })
    ]);
  
    // Send notifications to both users
    await Promise.all([
      sendNotification(referrer.id, "REFERRAL", {
        type: "REFERRAL_SUCCESS",
        message: `You've successfully referred ${refereeEmail}`,
        bonus: "FREE_SHIPPING",
        expiresAt: expiresAt.toISOString()
      }),
      sendNotification(refereeId, "REFERRAL", {
        type: "REFERRAL_BONUS",
        message: `You've received free shipping for 30 days!`,
        bonus: "FREE_SHIPPING",
        expiresAt: expiresAt.toISOString()
      })
    ]);
  }

  // Generate a unique referral code
export const  generateReferralCode = (email) => {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base.substring(0, 4)}${random}`;
}

// Calculate shipping fee (example implementation)
export const calculateShippingFee = (items) => {
  // Your shipping calculation logic
  const baseFee = 5.00; // Base shipping fee
  const perItemFee = 0.50; // Additional fee per item
  return baseFee + (items.length * perItemFee);
}

// Check if a user's free shipping is still valid
export const  validateUserFreeShipping = async(userId) => { 
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referralBonus: {
        where: {
          bonusType: 'FREE_SHIPPING',
          isUsed: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { expiresAt: 'asc' },
        take: 1
      }
    }
  });

  if (!user) return false;

  // If no active bonus, remove free shipping
  if (user.referralBonus.length === 0 && user.hasFreeShipping) {
    await prisma.user.update({
      where: { id: userId },
      data: { hasFreeShipping: false }
    });
    return false;
  }

  // If has active bonus but flag wasn't set
  if (user.referralBonus.length > 0 && !user.hasFreeShipping) {
    await prisma.user.update({
      where: { id: userId },
      data: { hasFreeShipping: true }
    });
    return true;
  }

  return user.hasFreeShipping;
}