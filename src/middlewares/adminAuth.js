import prisma from '../prismaClient.js';

export const adminAuth = async (req, res, next) => {
  try {
    // Get user from request (assuming you have auth middleware that attaches user)
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: No user ID found' 
      });
    }

    // Check if user has admin role
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // const isAdmin = userWithRoles?.roles?.some(
    //   userRole => userRole.role.name === 'Super Admin' || userRole.role.name === 'Admin' 
    // );

    // if (!isAdmin) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Forbidden: Admin access required' 
    //   });
    // }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};