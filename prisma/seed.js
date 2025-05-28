import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils.js";

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Step 1: Create all permissions
  const permissions = [
    // User Management
    { name: 'view_users', description: 'Permission to view all users' },
    { name: 'create_users', description: 'Permission to create new users' },
    { name: 'edit_users', description: 'Permission to edit existing users' },
    { name: 'delete_users', description: 'Permission to delete users' },

    // Product Management
    { name: 'view_products', description: 'Permission to view all products' },
    { name: 'create_products', description: 'Permission to create new products' },
    { name: 'edit_products', description: 'Permission to edit existing products' },
    { name: 'delete_products', description: 'Permission to delete products' },

    // Order Management
    { name: 'view_orders', description: 'Permission to view all orders' },
    { name: 'create_orders', description: 'Permission to create new orders' },
    { name: 'edit_orders', description: 'Permission to edit existing orders' },
    { name: 'delete_orders', description: 'Permission to delete orders' },

    // Role and Permission Management
    { name: 'view_roles', description: 'Permission to view all roles' },
    { name: 'create_roles', description: 'Permission to create new roles' },
    { name: 'edit_roles', description: 'Permission to edit existing roles' },
    { name: 'delete_roles', description: 'Permission to delete roles' },
    { name: 'view_permissions', description: 'Permission to view all permissions' },
    { name: 'assign_permissions', description: 'Permission to assign permissions to roles' },

    // Category Management
    { name: 'view_categories', description: 'Permission to view all categories' },
    { name: 'create_categories', description: 'Permission to create new categories' },
    { name: 'edit_categories', description: 'Permission to edit existing categories' },
    { name: 'delete_categories', description: 'Permission to delete categories' },

    // Manufacturer Management
    { name: 'view_manufacturers', description: 'Permission to view all manufacturers' },
    { name: 'create_manufacturers', description: 'Permission to create new manufacturers' },
    { name: 'edit_manufacturers', description: 'Permission to edit existing manufacturers' },
    { name: 'delete_manufacturers', description: 'Permission to delete manufacturers' },

    // Cart Management
    { name: 'view_carts', description: 'Permission to view all carts' },
    { name: 'edit_carts', description: 'Permission to edit carts' },

    // Transaction Management
    { name: 'view_transactions', description: 'Permission to view all transactions' },
    { name: 'edit_transactions', description: 'Permission to edit transactions' },

    // Shipping Management
    { name: 'view_shipping', description: 'Permission to view all shipping details' },
    { name: 'edit_shipping', description: 'Permission to edit shipping details' },

    // Feedback Management
    { name: 'view_feedback', description: 'Permission to view all feedback' },
    { name: 'delete_feedback', description: 'Permission to delete feedback' },

    // Notification Management
    { name: 'view_notifications', description: 'Permission to view all notifications' },
    { name: 'send_notifications', description: 'Permission to send notifications' },

    // System Settings
    { name: 'manage_settings', description: 'Permission to manage system settings' },
  ];

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true, // Skip if permissions already exist
  });

  console.log('Created permissions:', permissions);

  // Step 2: Create the Super Admin role and assign all permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {}, // Do nothing if the role already exists
    create: {
      name: 'Super Admin',
      description: 'A user with full access to all features and permissions',
      permissions: {
        connect: permissions.map((permission) => ({ name: permission.name })),
      },
    },
  });

  console.log('Created Super Admin role:', superAdminRole);
  const hashedPWD = await hashPassword('1234567890');

  // Step 3: Create a Super Admin user
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'account@buylocalafrica.com' },
    update: {}, // Do nothing if the user already exists
    create: {
      email: 'account@buylocalafrica.com',
      password: hashedPWD, 
      isVerified: true,
      type: 'admin',
    },
  });

  console.log('Created Super Admin user:', superAdminUser);

  // Step 4: Assign the Super Admin role to the user
  const userRole = await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
    update: {}, // Do nothing if the role is already assigned
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Assigned Super Admin role to user:', userRole);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });