import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSPrisma from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// Register the Prisma adapter
AdminJS.registerAdapter({
  Resource: AdminJSPrisma.Resource,
  Database: AdminJSPrisma.Database,
});

const prisma = new PrismaClient();

const getPrismaModel = (modelName) => {
    try {
      const model = AdminJSPrisma.getModelByName(modelName);
      return { model, client: prisma };
    } catch (error) {
      console.error(`Failed to get model ${modelName}:`, error);
      throw error;
    }
};

const usersNavigation = {
    name: 'Users',
    icon: 'User',
}

const adminOptions = {
    resources: [
        // User Resource

    //      // Customers Parent Resource (virtual resource for the Customers section)
    //   {
    //     resource: {
    //       model: {
    //         name: 'Customer',
    //         properties: {
    //           id: { isVisible: false },
    //           customerType: {
    //             type: 'string',
    //             availableValues: [
    //               { value: 'individual', label: 'Individual' },
    //               { value: 'business', label: 'Business' }
    //             ]
    //           }
    //         }
    //       }
    //     },
    //     options: {
    //       navigation: {
    //         name: 'Customers',
    //         icon: 'User'
    //       },
    //       actions: {
    //         list: {
    //           handler: async (request, response, context) => {
    //             // This is just a parent menu item, actual data comes from child resources
    //             return { records: [] };
    //           }
    //         }
    //       }
    //     }
    //   },
    //     {
    //         resource: getPrismaModel('User'),
    //         options: {
    //             navigation:usersNavigation,
    //             properties: {
                    
    //                 password: { isVisible: false },
    //                 verificationCode: { isVisible: false },
    //                 status: {
    //                 availableValues: [
    //                     { value: 'ACTIVE', label: 'Active' },
    //                     { value: 'INACTIVE', label: 'Inactive' },
    //                     { value: 'SUSPENDED', label: 'Suspended' }
    //                 ]
    //                 },
    //                 createdAt: { 
    //                 isVisible: { 
    //                     list: true, 
    //                     edit: false, 
    //                     show: true,
    //                     filter: true
    //                 }
    //                 },
    //                 updatedAt: { 
    //                 isVisible: { 
    //                     list: false, 
    //                     edit: false, 
    //                     show: true 
    //                 }
    //                 }
    //             }
    //         }
    //     },

    //     // User Profile
    //     {
    //         resource: getPrismaModel('UserProfile'),
    //         options: {
    //             navigation:usersNavigation,
    //             properties: {
    //                 user: { isVisible: { edit: false, show: true, list: true } }
    //             }
    //         }
    //     },
    //     // Business Profile
    //     {
    //         resource: getPrismaModel('BusinessProfile'),
    //         options: {
    //             navigation:usersNavigation,
    //             properties: {
    //                 user: { isVisible: { edit: false, show: true, list: true } }
    //             }
    //         }
    //     },
    //     // Admin Profile
    //     {
    //         resource: getPrismaModel('AdminProfile'),
    //         options: {
    //             navigation:usersNavigation,
    //             properties: {
    //                 user: { isVisible: { edit: false, show: true, list: true } },
    //                 role: {
    //                 availableValues: [
    //                     { value: 'SUPER_ADMIN', label: 'Super Admin' },
    //                     { value: 'ADMIN', label: 'Admin' },
    //                     { value: 'SUPPORT', label: 'Support' }
    //                 ]
    //                 }
    //             }
    //         }
    //     },
    //       // PRODUCT RESOURCES
    // {
    //     resource: getPrismaModel('Product'),
    //     options: {
    //       properties: {
    //         description: { type: 'richtext' },
    //         isActive: { isVisible: { list: true, filter: true } },
    //         type: {
    //           availableValues: [
    //             { value: 'platform', label: 'Platform' },
    //             { value: 'business', label: 'Business' }
    //           ]
    //         }
    //       }
    //     }
    //   },
    //   {
    //     resource: getPrismaModel('ProductOption'),
    //     options: {
    //       properties: {
    //         product: { isVisible: { edit: false, show: true } },
    //         markupType: {
    //           availableValues: [
    //             { value: 'FIXED', label: 'Fixed' },
    //             { value: 'PERCENTAGE', label: 'Percentage' }
    //           ]
    //         }
    //       }
    //     }
    //   },
    //   {
    //     resource: getPrismaModel('Category'),
    //     options: {
    //       properties: {
    //         products: { isVisible: { list: false } }
    //       }
    //     }
    //   },
    //   {
    //     resource: getPrismaModel('Manufacturer'),
    //     options: {
    //       properties: {
    //         products: { isVisible: { list: false } },
    //         status: { isVisible: { list: true, filter: true } }
    //       }
    //     }
    //   },
  
    //   // ORDER RESOURCES
    //   {
    //     resource: getPrismaModel('Order'),
    //     options: {
    //       properties: {
    //         user: { isVisible: { edit: false, show: true } },
    //         status: {
    //           availableValues: [
    //             { value: 'PENDING', label: 'Pending' },
    //             { value: 'PROCESSING', label: 'Processing' },
    //             { value: 'COMPLETED', label: 'Completed' },
    //             { value: 'CANCELLED', label: 'Cancelled' }
    //           ]
    //         },
    //         paymentStatus: {
    //           availableValues: [
    //             { value: 'PENDING', label: 'Pending' },
    //             { value: 'PAID', label: 'Paid' },
    //             { value: 'FAILED', label: 'Failed' }
    //           ]
    //         },
    //         totalPrice: {
    //           type: 'currency'
    //         }
    //       }
    //     }
    //   },
    //   {
    //     resource: getPrismaModel('OrderItem'),
    //     options: {
    //       properties: {
    //         order: { isVisible: { edit: false } },
    //         product: { isVisible: { edit: false } },
    //         price: { type: 'currency' }
    //       }
    //     }
    //   },
    //   {
    //     resource: getPrismaModel('Transaction'),
    //     options: {
    //       properties: {
    //         order: { isVisible: { edit: false } },
    //         amount: { type: 'currency' },
    //         status: {
    //           availableValues: [
    //             { value: 'pending', label: 'Pending' },
    //             { value: 'success', label: 'Success' },
    //             { value: 'failed', label: 'Failed' }
    //           ]
    //         }
    //       }
    //     }
    //   }
    ],
    branding: {
      companyName: 'User Management',
      logo: false
    },
    dashboard: {
      handler: async () => {
        const [usersCount, activeUsers, adminsCount] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { status: 'ACTIVE' } }),
          prisma.adminProfile.count()
        ])
        return { usersCount, activeUsers, adminsCount }
      }
    }
  }

const admin = new AdminJS(adminOptions);

// Create router with authentication
// const buildAdminRouter = (admin) => {
//   const router = AdminJSExpress.buildAuthenticatedRouter(
//     admin,
//     {
//       authenticate: async (email, password) => {
//         const user = await prisma.user.findUnique({
//           where: { email },
//         });
        
//         if (user && user.role === 'ADMIN') {
//           // In a real app, verify the password properly
//           // For example: await bcrypt.compare(password, user.passwordHash)
//           return user;
//         }
//         return null;
//       },
//       cookiePassword: process.env.ADMINJS_COOKIE_SECRET || 'some-secret-password',
//     },
//     null,
//     {
//       resave: false,
//       saveUninitialized: true,
//       secret: process.env.ADMINJS_SESSION_SECRET || 'another-secret',
//       cookie: {
//         httpOnly: process.env.NODE_ENV === 'production',
//         secure: process.env.NODE_ENV === 'production',
//       },
//       name: 'adminjs',
//     }
//   );
//   return router;
// };

const buildAdminRouter = (admin) => {
    const router = AdminJSExpress.buildRouter(admin);
    return router;
  };
export const adminRouter = buildAdminRouter(admin);
export default admin;