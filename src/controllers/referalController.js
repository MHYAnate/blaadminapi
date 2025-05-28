import prisma from "../prismaClient.js";

// Get user's referral information
  const getReferralInfo = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCode: true,
          referredBy: true,
          hasFreeShipping: true,
          referralBonus: {
            where: {
              expiresAt: { gt: new Date() },
              isUsed: false
            },
            orderBy: { expiresAt: 'asc' }
          },
          _count: {
            select: {
              referralsMade: true,
              referralsReceived: true
            }
          }
        }
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({
        success: true,
        data: {
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          hasFreeShipping: user.hasFreeShipping,
          activeBonuses: user.referralBonus,
          referralsMade: user._count.referralsMade,
          referralsReceived: user._count.referralsReceived
        }
      });
    } catch (error) {
      console.error('Error fetching referral info:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch referral information",
        error: error.message
      });
    }
  };
  
  // Get referral history
  const getReferralHistory = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
  
    try {
      const referrals = await prisma.referral.findMany({
        where: {
          OR: [
            { referrerId: userId },
            { refereeId: userId }
          ]
        },
        include: {
          referrer: {
            select: {
              id: true,
              email: true
            }
          },
          referee: {
            select: {
              id: true,
              email: true
            }
          },
          bonusesGiven: {
            where: {
              OR: [
                { userId: userId },
                { 
                  referral: {
                    referrerId: userId
                  }
                }
              ]
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });
  
      const total = await prisma.referral.count({
        where: {
          OR: [
            { referrerId: userId },
            { refereeId: userId }
          ]
        }
      });
  
      res.status(200).json({
        success: true,
        data: referrals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching referral history:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch referral history",
        error: error.message
      });
    }
  };
  
  // Validate a referral code
  const validateReferralCode = async (req, res) => {
    const { code } = req.params;
  
    try {
      const referral = await prisma.user.findUnique({
        where: { referralCode: code },
        select: {
          id: true,
          email: true
        }
      });
  
      if (!referral) {
        return res.status(404).json({ 
          success: false,
          message: "Invalid referral code" 
        });
      }
  
      res.status(200).json({
        success: true,
        data: {
          isValid: true,
          referrer: {
            id: referral.id,
            email: referral.email
          }
        }
      });
    } catch (error) {
      console.error('Error validating referral code:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to validate referral code",
        error: error.message
      });
    }
  };

  export {
      getReferralInfo,
      getReferralHistory,
      validateReferralCode
  }