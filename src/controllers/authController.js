
import { validationResult } from 'express-validator';

import {  generateReferralCode, generateVerificationCode, hashPassword, processReferral } from '../utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../mailer.js';
import { sendNotification } from '../services/notificationService.js';

const SECRET_KEY = process.env.JWT_SECRET;

const registerHandler = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, type, password, referal_code } = req.body;

  try {

    // Generate a unique referral code for the new user
    const referralCode = generateReferralCode(email);

    // Create the user data object
    const userData = {
      email,
      type,
      password: await hashPassword(password),
      status: 'ACTIVE',
      referralCode,
    };


    // If referral code was provided, add to user data
    if (referal_code) {
      userData.referredBy = referal_code;
    }

    // Create the user
    const user = await prisma.user.create({
      data: userData,
    });

    // Process referral if one was provided
    if (referal_code) {
      try {
        await processReferral(referal_code, user.id, user.email);
      } catch (referralError) {
        console.error('Referral processing error:', referralError);
        // Don't fail registration if referral processing fails
      }
    }

    // Determine default role based on user type 
    let defaultRoleName = type === 'business' ? 'business_owner' : 'customer';
    const defaultRole = await prisma.role.findFirst({ 
      where: { name: defaultRoleName } 
    });

    // Assign the role to the user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: defaultRole.id,
      },
    });

    // Generate and send verification code
    const code = await generateVerificationCode(user.id);
    
    // send welcome email
    // await sendVerificationEmail(user.email, user.email, code);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        type: user.type, 
        roles: [defaultRoleName],
        hasFreeShipping: user.hasFreeShipping
      },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // const response = {
    //   id: user.id,
    //   email: user.email,
    //   isVerified: user.isVerified,
    //   type: user.type,
    //   status: user.status,
    //   roles: [defaultRoleName],
    //   code,
    //   token,
    //   referralCode: user.referralCode,
    //   hasFreeShipping: user.hasFreeShipping
    // };

    // authController.js - loginHandler
const response = {
  success: true,
  message: 'Login successful',
  data: {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.profile?.fullName || user.businessProfile?.businessName,
      type: user.type,
      isVerified: user.isVerified,
      profile: user.profile || user.businessProfile,
      roles: user.roles.map(r => r.role.name), // Fix role format
      addresses: user.address
    }
  }
};

res.status(200).json(response);

    return res.status(201).json({ 
      message: 'User registered successfully', 
      response 
    });
    
  } catch (error) {
    console.error('Registration Error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    return res.status(500).json({ error: 'Failed to register user' });
  }
};
  

// auth.controller.js
// const loginHandler = async (req, res) => {
//   const errors = validationResult(req);
  
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { email, password } = req.body;

//   try {
//     // 1. Find user with email
//     const user = await prisma.user.findUnique({
//       where: { email },
//       include: {
//         profile: true,
//         businessProfile: true,
//         address: true, 
//         roles: {
//           include: {
//             role: true
//           }
//         }
//       }
//     });

//     // 2. Verify user exists and password matches
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Invalid credentials' 
//       });
//     }

//     // 3. Generate JWT token
//     const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });
//     const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
    
//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         token,
//         refreshToken,
//         user: {
//           id: user.id,
//           email: user.email,
//         name: user.profile?.fullName || user.businessProfile?.businessName,
//         type: user.type,
//         isVerified: user.isVerified,
//         profile: user.profile || user.businessProfile,
//         role: user.roles,
//         addresses: user.address
//       }
//     }})
    

//     // res.status(200).json({
//     //   success: true,
//     //   message: 'Login successful',
//     //   data: response
//     // });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Server error during login' 
//     });
//   }
// };
const loginHandler = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        businessProfile: true,
        address: true,
        roles: {
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Extract role names
    const roleNames = user.roles.map(ur => ur.role.name);

    // Create token payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      type: user.type,
      roles: roleNames,
      hasFreeShipping: user.hasFreeShipping
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user response data
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.profile?.fullName || user.businessProfile?.businessName,
      type: user.type,
      isVerified: user.isVerified,
      profile: user.type === 'individual' ? user.profile : user.businessProfile,
      roles: roleNames,
      addresses: user.address
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Specific error for Prisma issues
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        code: error.code
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
};
export const refreshTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // Generate new access token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    
    // Optionally generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    
    res.json({ 
      token,
      refreshToken: newRefreshToken 
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

const userDetailsHandler = async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.type;

  try {
    // Dynamically include only the relevant profile based on userType
    const include = {
      address: true,
      roles: {
        include: {
          role: true,
        },
      },
      
    };

    if (userType === "individual") {
      include.profile = true;
    } else if (userType === "business") {
      include.businessProfile = true;
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include,
    });

    if (!user) {
      return res.status(200).json({
        message: "User not found",
        data: null,
      });
    }

    // Remove password and the irrelevant profile type from the user object
    const { password, profile, businessProfile, ...userWithoutPassword } = user;

    // If userType is individual, include profile; otherwise, include businessProfile
    const userProfile = userType === 'individual' ? user.profile : user.businessProfile;

    return res.status(200).json({
      message: "User details fetched successfully",
      data: {
        ...userWithoutPassword,
        profile: userProfile,
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ error: "Failed to fetch user details" });
  }
};

// Verify Email Code
const verifyHandler = async (req, res) => {
  const { email, code } = req.body;

  try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
          return res.status(204).json({ error: 'User not found' });
      }

      if (user.isVerified) {
          return res.status(400).json({ error: 'User already Verified' });
      }

      const verificationCode = await prisma.verificationCode.findFirst({
          where: { userId: user.id, code },
      });

      console.log("Verification",verificationCode);

      if (!verificationCode || verificationCode.expiresAt < new Date()) {
          return res.status(400).json({ error: 'Invalid or expired code' });
      }

      await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
      });
      

      // await sendWelcomeEmail(user.email, user.email);
      // await sendNotification(user.id, 'Welcome to BuyLocal! Your email has been verified successfully.');

      return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
      return res.status(500).json({ error: 'Failed to verify email' });
  }
};


// Reset Password Request
const resetPasswordHandler = async (req, res) => {
  const { email } = req.body;

  try {
   
    const user = await prisma.user.findUnique({ where: { email } });
   
    if (!user) {
      return res.status(204).json({ error: 'User not found' });
    }

    
    const verificationCode = await generateVerificationCode(user.id);

    // Send reset email (implement sendResetEmail separately)
    // await sendResetEmail(email, verificationCode);

      return res.status(200).json({ message: 'Password reset code sent' });
  } catch (error) {
      return res.status(500).json({ error: 'Failed to send reset code' });
  }
};


// Logout (client-side should remove token)
const logoutHandler = (req, res) => {
  try {
    res.clearCookie('jwt'); // Clear the JWT cookie

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    
  }
};


// Update User Preferences
const updateUserPreferencesHandler = async (req, res) => {
  console.log("Request Body:", req.body); // Debugging

  const { preference } = req.body;

  // Check if preference is an array
  if (!Array.isArray(preference)) {
      return res.status(400).json({ error: "Preference must be an array" });
  }

  const userId = req.user?.id; // Ensure req.user exists

  if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await prisma.userPreference.upsert({
      where: { userId }, // Unique identifier
      update: { preference }, // Update if exists
      create: { userId, preference }, // Create if not exists
  });

      return res.status(200).json({ message: "Preferences updated" });
  } catch (error) {
      console.error("Database Error:", error);
      return res.status(500).json({ error: "Failed to update preferences" });
  }
};


const updateUserProfileHandler = async (req, res) => {
  const { 
    fullName, 
    address, 
    dob, 
    howDidYouFindUs, 
    businessName, 
    cac, 
    deliveryPhone, 
    businessPhone 
  } = req.body;

  const userId = req.user.id;
  const userType = req.user.type;

  try {
    if (userType === "individual") {
      let updates = {};

      // Validate and parse DOB
      if (dob) {
        const parsedDob = new Date(dob);
        if (isNaN(parsedDob.getTime())) {
          return res.status(400).json({ error: "Invalid date format for DOB. Expected format: YYYY-MM-DD" });
        }
        updates.dob = parsedDob;
      }

      // Only add fields to updates if they are provided in the request
      if (fullName !== undefined) updates.fullName = fullName;
      if (address !== undefined) updates.address = address;
      if (howDidYouFindUs !== undefined) updates.howDidYouHear = howDidYouFindUs;
      if (deliveryPhone !== undefined) updates.deliveryPhone = deliveryPhone;

      const userProfile = await prisma.userProfile.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates
        },
      });

    } else if (userType === "business") {
      let updates = {};

      // Only add fields to updates if they are provided in the request
      if (fullName !== undefined) updates.fullName = fullName;
      if (businessName !== undefined) updates.businessName = businessName;
      if (address !== undefined) updates.businessAddress = address;
      if (cac !== undefined) updates.cacNumber = cac;
      if (howDidYouFindUs !== undefined) updates.howDidYouHear = howDidYouFindUs;
      if (businessPhone !== undefined) updates.businessPhone = businessPhone;

      const businessProfile = await prisma.businessProfile.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates
        },
      });

    } else {
      console.error("Invalid user type:", userType);
      return res.status(400).json({ error: "Invalid user type" });
    }

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Database Error:", error.message || error);
    return res.status(500).json({ 
      error: "Failed to update profile",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Resend Verification Email
 */
const resendVerificationHandler = async (req, res) => {
  const { email } = req.body;
  try {
    
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(user);

    if (!user) {
      return res.status(204).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    const code = await generateVerificationCode(user.id);
    console.log(code)
    await sendVerificationEmail(email, email, code);

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

/**
 * Update Profile
 */
const updateProfileHandler = async (req, res) => {
  const { userId, email, type } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email, type },
    });

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Set or Reset Password
 */
const setPasswordHandler = async (req, res) => {
  const { email, password, confirmPassword, code } = req.body;

  // Validate input errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return res.status(204).json({ error: 'User not found' });
    }

    // Find the verification code for the user
    const verificationCode = await prisma.verificationCode.findUnique({
      where: { userId: user.id },
      select: { code: true, expiresAt: true },
    });

    if (!verificationCode) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check if the code matches
    if (verificationCode.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if the code has expired
    if (verificationCode.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and delete the verification code
    await prisma.$transaction([

      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      
      prisma.verificationCode.delete({
        where: { userId: user.id },
      }),
    
    ]);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
};


// const requestPasswordReset = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user) {
//       return res.status(204).json({ error: 'User not found' });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     const hashedToken = await bcrypt.hash(resetToken, 10);

//     // Store reset token with expiration
//     await prisma.user.update({
//       where: { email },
//       data: {
//         resetToken: hashedToken,
//         resetTokenExpires: new Date(Date.now() + 3600000), // 1-hour expiry
//       },
//     });

//     // Send email with reset token
//     await sendPasswordResetEmail(email, resetToken);

//     return res.status(200).json({ message: 'Password reset email sent.' });
//   } catch (error) {
//     return res.status(500).json({ error: 'Failed to process request.' });
//   }
// };

// const resetPassword = async (req, res) => {
//   const { email, token, newPassword } = req.body;

//   try {
//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user || !user.resetToken) {
//       return res.status(400).json({ error: 'Invalid or expired token.' });
//     }

//     // Verify token
//     const isMatch = await bcrypt.compare(token, user.resetToken);
  
//     if (!isMatch || user.resetTokenExpires < new Date()) {
//       return res.status(400).json({ error: 'Invalid or expired token.' });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update user password & remove reset token
//     await prisma.user.update({
//       where: { email },
//       data: {
//         password: hashedPassword,
//         resetToken: null,
//         resetTokenExpires: null,
//       },
//     });

//     return res.status(200).json({ message: 'Password reset successful.' });
//   } catch (error) {
//     return res.status(500).json({ error: 'Failed to reset password.' });
//   }
// };




// Repeat similar structure for verifyHandler, resendVerificationHandler, updateProfileHandler, setPasswordHandler
export  {
  registerHandler,
  loginHandler,
  verifyHandler,
  logoutHandler,
  resetPasswordHandler,
  resendVerificationHandler,
  setPasswordHandler,
  updateUserPreferencesHandler,
  updateUserProfileHandler,
  updateProfileHandler,
  userDetailsHandler
};

