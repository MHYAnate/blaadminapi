import prisma from "../../prismaClient.js";
import {
	generateAdminInviteUrl,
	hashPassword,
	verifySignedUrl,
} from "../../utils.js";

// Utility function to check admin status with improved error handling
const isUserAdmin = async (userId) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				roles: {
					include: {
						role: true,
					},
				},
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user.roles.some(
			(role) =>
				role.role.name.includes("admin") || role.role.name === "super_admin"
		);
	} catch (error) {
		console.error("Error checking admin status:", error);
		throw error;
	}
};

// Invite User to become Admin with validation
export const inviteAdmin = async (req, res) => {
	try {
		const { email, roleNames } = req.body;
		const inviterId = req.user.id;

		// Validate input
		if (!email || !roleNames || !Array.isArray(roleNames)) {
			return res
				.status(400)
				.json({ error: "Email and roleNames array are required" });
		}

		// Verify inviter is admin
		const isAdmin = await isUserAdmin(inviterId);
		if (!isAdmin) {
			return res
				.status(403)
				.json({ error: "Only admins can invite other admins" });
		}

		// Generate temporary password
		const TEMPORARY_PASSWORD = "1234567890"; // In production, use crypto.randomBytes()
		const hashedPassword = await hashPassword(TEMPORARY_PASSWORD);

		let user; // Declare user variable at the function scope

		// Transaction to ensure data consistency
		const transactionResult = await prisma.$transaction(async (prisma) => {
			// Check if user exists first
			user = await prisma.user.findUnique({
				where: { email },
			});

			if (user) {
				// Update existing user with new password and status
				user = await prisma.user.update({
					where: { email },
					data: {
						password: hashedPassword,
						status: "INACTIVE",
					},
				});
			} else {
				// Create new user with hashed password
				user = await prisma.user.create({
					data: {
						email,
						type: "individual",
						status: "INACTIVE",
						password: hashedPassword,
					},
				});
			}

			// Get requested roles
			const roles = await prisma.role.findMany({
				where: {
					name: { in: roleNames },
				},
			});

			if (roles.length !== roleNames.length) {
				const foundRoleNames = roles.map((r) => r.name);
				const missingRoles = roleNames.filter(
					(name) => !foundRoleNames.includes(name)
				);
				throw new Error(`Invalid roles: ${missingRoles.join(", ")}`);
			}

			// Remove existing roles first to avoid duplicates
			await prisma.userRole.deleteMany({
				where: { userId: user.id },
			});

			// Assign roles
			await prisma.userRole.createMany({
				data: roles.map((role) => ({
					userId: user.id,
					roleId: role.id,
				})),
			});

			return user;
		});

		// Generate invite URL after transaction completes
		const { url, token, expiresAt } = generateAdminInviteUrl(email, user.id);

		// Store verification code
		await prisma.verificationCode.create({
			data: {
				userId: user.id,
				code: token,
				expiresAt,
			},
		});

		// Send single response
		return res.json({
			success: true,
			message: "Admin invitation sent successfully",
			data: {
				userId: user.id,
				inviteUrl: url,
			},
		});
	} catch (error) {
		console.error("Error inviting admin:", error);

		let status = 500;
		let errorMessage = "Failed to invite admin";

		if (error.code === "P2002") {
			status = 400;
			errorMessage = "User with this email already exists";
		} else if (error.message.includes("Invalid roles")) {
			status = 400;
			errorMessage = error.message;
		}

		return res.status(status).json({
			success: false,
			error: errorMessage,
			...(process.env.NODE_ENV === "development" && {
				details: error.message,
			}),
		});
	}
};

export const registerInvitedAdmin = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    // Verify signed URL
    const { valid, email, userId, error: urlError } = verifySignedUrl(req);
    if (!valid) {
      return res.status(400).json({ error: urlError || 'Invalid invitation URL' });
    }

    const { password, fullName, username, gender, phone, role } = req.body;

    // Validate required fields
    const requiredFields = ['password', 'fullName', 'username', 'phone', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }

    // Password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check for existing admin credentials
    const existingAdmin = await prisma.adminProfile.findFirst({
      where: { OR: [{ username }, { phone }] }
    });
    if (existingAdmin) {
      return res.status(400).json({
        error: existingAdmin.username === username 
          ? 'Username already taken' 
          : 'Phone number already in use'
      });
    }

    // Verify invited user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, email },
      include: { verificationCode: true }
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid admin invitation' });
    }

    const hashedPassword = await hashPassword(password);

    // Transaction: update user, upsert adminProfile, upsert userRole, clear codes
    await prisma.$transaction(async (tx) => {
      // 1) Update the base user
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          phoneNumber: phone,
          status: 'ACTIVE',
          isVerified: true,
          updatedAt: new Date()
        }
      });

      // 2) Upsert adminProfile to avoid duplicate userId constraint
      await tx.adminProfile.upsert({
        where: { userId },
        update: { fullName, username, gender, phone, role },
        create: { userId, fullName, username, gender, phone, role }
      });

      // 3) Upsert userRole (assumes compound unique on userId+roleId)
      // await tx.userRole.upsert({
      //   where: {
      //     userId_roleId: {
      //       userId,
      //       roleId: 4  // Admin role ID
      //     }
      //   },
      //   update: {},
      //   create: {
      //     userId,
      //     roleId: 4
      //   }
      // });

      // 4) Clear any verification codes
      await tx.verificationCode.deleteMany({ where: { userId } });
    });

    // Fetch fresh user data with adminProfile & roles
    const fullUserData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true,
        roles: { include: { role: true } }
      }
    });

    // Map into response.profile
    const responseData = {
      id: fullUserData.id,
      email: fullUserData.email,
      status: fullUserData.status,
      isVerified: fullUserData.isVerified,
      createdAt: fullUserData.createdAt,
      profile: {
        fullName: fullUserData.adminProfile.fullName,
        username: fullUserData.adminProfile.username,
        role: fullUserData.adminProfile.role,
        gender: fullUserData.adminProfile.gender,
        phone: fullUserData.adminProfile.phone
      },
      roles: fullUserData.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      }))
    };

    return res.json({
      success: true,
      message: 'Admin registration completed successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Admin registration error:', error);

    // Handle Prisma unique-constraint (P2002) errors
    if (error.code === 'P2002') {
      const target = error.meta?.target?.[0];  // e.g. 'username', 'email', 'phoneNumber', 'userId'
      let message;
      switch (target) {
        case 'username':
          message = 'Username already taken';
          break;
        case 'phoneNumber':
          message = 'Phone number already in use';
          break;
        case 'email':
          message = 'Email already in use';
          break;
        case 'userId':
          message = 'Admin profile for this user already exists';
          break;
        default:
          message = `Duplicate value for unique field: ${target}`;
      }
      return res.status(400).json({ error: message });
    }

    // Generic error handler
    return res.status(500).json({
      error: 'Failed to complete admin registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const getAllAdmins = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "" } = req.query;
		const pageNumber = parseInt(page);
		const limitNumber = parseInt(limit);
		const offset = (pageNumber - 1) * limitNumber;

		// Build search condition
		const searchCondition = search
			? {
					OR: [
						{ email: { contains: search, mode: "insensitive" } },
						{
							profile: { fullName: { contains: search, mode: "insensitive" } },
						},
					],
				}
			: {};

		const where = {
			...searchCondition,
			roles: {
				some: {
					role: {
						name: { contains: "admin" },
					},
				},
			},
		};

		// Get paginated results
		const [admins, totalCount] = await Promise.all([
			prisma.user.findMany({
				where,
				skip: offset,
				take: limitNumber,
				select: {
					id: true,
					email: true,
					status: true,
					createdAt: true,
				  adminProfile:true,
					roles: {
						select: {
							role: {
								select: {
									id: true,
									name: true,
									description: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			}),
			prisma.user.count({ where }),
		]);

		const totalPages = Math.ceil(totalCount / limitNumber);

		res.json({
			data: admins,
			pagination: {
				totalItems: totalCount,
				totalPages,
				currentPage: pageNumber,
				itemsPerPage: limitNumber,
				hasNextPage: pageNumber < totalPages,
				hasPreviousPage: pageNumber > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching admins:", error);
		res.status(500).json({ error: "Failed to fetch admins" });
	}
};

export const updateAdminRoles = async (req, res) => {
	try {
		const { userId } = req.params;
		const { roleNames } = req.body;

		if (!roleNames || !Array.isArray(roleNames)) {
			return res.status(400).json({ error: "roleNames array is required" });
		}

		const validRoleNames = roleNames.filter(Boolean);

		if (validRoleNames.length === 0) {
			return res
				.status(400)
				.json({ error: "At least one valid role name is required" });
		}

		// Verify requester is admin
		if (!(await isUserAdmin(req.user.id))) {
			return res.status(403).json({ error: "Admin access required" });
		}

		await prisma.$transaction(async (prisma) => {
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
			});

			if (!user) {
				throw new Error("User not found");
			}

			const roles = await prisma.role.findMany({
				where: {
					name: { in: validRoleNames },
				},
			});

			if (roles.length !== validRoleNames.length) {
				const foundRoleNames = roles.map((r) => r.name);
				const missingRoles = validRoleNames.filter(
					(name) => !foundRoleNames.includes(name)
				);
				throw new Error(`Invalid roles: ${missingRoles.join(", ")}`);
			}

			// Get all roles with 'admin' in the name (case-insensitive)
			const adminRoles = await prisma.role.findMany({
				where: {
					name: {
						contains: "admin",
						mode: "insensitive",
					},
				},
				select: { id: true },
			});

			// Remove existing admin roles for the user
			await prisma.userRole.deleteMany({
				where: {
					userId: parseInt(userId),
					roleId: { in: adminRoles.map((r) => r.id) },
				},
			});

			// Assign new admin roles
			await prisma.userRole.createMany({
				data: roles.map((role) => ({
					userId: parseInt(userId),
					roleId: role.id,
				})),
				skipDuplicates: true,
			});
		});

		res.json({ message: "Admin roles updated successfully" });
	} catch (error) {
		console.error("Error updating admin roles:", error);
		const status =
			error.message.includes("Invalid roles") ||
			error.message.includes("User not found")
				? 400
				: 500;
		res.status(status).json({
			error: error.message || "Failed to update admin roles",
		});
	}
};

// Remove admin privileges with validation
export const removeAdmin = async (req, res) => {
	try {
		const { userId } = req.params;

		// Verify requester is admin
		if (!(await isUserAdmin(req.user.id))) {
			return res.status(403).json({ error: "Admin access required" });
		}

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Remove all admin roles
		const result = await prisma.userRole.deleteMany({
			where: {
				userId: parseInt(userId),
				role: {
					name: { contains: "Admin" },
				},
			},
		});

		if (result.count === 0) {
			return res.status(400).json({ error: "User is not an admin" });
		}

		res.json({ message: "Admin privileges removed successfully" });
	} catch (error) {
		console.error("Error removing admin:", error);
		res.status(500).json({ error: "Failed to remove admin privileges" });
	}
};

// Check if current user is admin
export const checkAdminStatus = async (req, res) => {
	try {
		const isAdmin = await isUserAdmin(req.user.id);
		res.json({ isAdmin });
	} catch (error) {
		console.error("Error checking admin status:", error);
		res.status(500).json({ error: "Failed to check admin status" });
	}
};

// Get admin permissions with pagination
export const getAdminPermissions = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		const pageNumber = parseInt(page);
		const limitNumber = parseInt(limit);
		const offset = (pageNumber - 1) * limitNumber;

		// First get the user with their roles
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			include: {
				roles: {
					include: {
						role: {
							include: {
								permissions: true, // This correctly references the permissions relation
							},
						},
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get all unique role IDs
		const roleIds = user.roles.map((userRole) => userRole.role.id);

		// Get paginated permissions through the roles
		const [permissions, totalCount] = await Promise.all([
			prisma.permission.findMany({
				where: {
					roles: {
						some: {
							id: {
								in: roleIds,
							},
						},
					},
				},
				distinct: ["id"], // Ensure we don't get duplicate permissions
				skip: offset,
				take: limitNumber,
				orderBy: {
					name: "asc",
				},
			}),
			prisma.permission.count({
				where: {
					roles: {
						some: {
							id: {
								in: roleIds,
							},
						},
					},
				},
			}),
		]);

		const totalPages = Math.ceil(totalCount / limitNumber);

		res.json({
			data: permissions,
			pagination: {
				totalItems: totalCount,
				totalPages,
				currentPage: pageNumber,
				itemsPerPage: limitNumber,
				hasNextPage: pageNumber < totalPages,
				hasPreviousPage: pageNumber > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching admin permissions:", error);
		res.status(500).json({ error: "Failed to fetch permissions" });
	}
};

// Get all roles with pagination and filtering
export const getRoles = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search = "",
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		const pageNumber = parseInt(page);
		const limitNumber = parseInt(limit);
		const offset = (pageNumber - 1) * limitNumber;

		// Build search condition
		const searchCondition = search
			? {
					OR: [
						{ name: { contains: search, mode: "insensitive" } },
						{ description: { contains: search, mode: "insensitive" } },
					],
				}
			: {};

		const where = { ...searchCondition };

		// Get paginated results
		const [roles, totalCount] = await Promise.all([
			prisma.role.findMany({
				where,
				skip: offset,
				take: limitNumber,
				include: {
					permissions: {
						select: {
							id: true,
							name: true,
						},
					},
					_count: {
						select: {
							users: true,
						},
					},
				},
				orderBy: {
					[sortBy]: sortOrder,
				},
			}),
			prisma.role.count({ where }),
		]);

		const totalPages = Math.ceil(totalCount / limitNumber);

		res.json({
			data: roles,
			pagination: {
				totalItems: totalCount,
				totalPages,
				currentPage: pageNumber,
				itemsPerPage: limitNumber,
				hasNextPage: pageNumber < totalPages,
				hasPreviousPage: pageNumber > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching roles:", error);
		res.status(500).json({ error: "Failed to fetch roles" });
	}
};

// export const deleteAdmin = async (req, res) => {
// 	const { id } = req.params;
// 	try {
// 		// Ensure the ID is a number
// 		const adminId = parseInt(id);
// 		if (isNaN(adminId)) {
// 			return res.status(400).json({ error: "Invalid admin ID" });
// 		}

// 		// Logic to delete admin by ID
// 		await prisma.userRole.deleteMany({
// 			where: {
// 				userId: adminId,
// 				role: {
// 					name: { contains: "admin" }, // Assuming 'admin' in the role name signifies an admin role
// 				},
// 			},
// 		});

// 		res.status(200).json({ message: "Admin privileges removed successfully" });
// 	} catch (err) {
// 		console.error("Error deleting admin:", err);
// 		res.status(500).json({ error: "Failed to remove admin privileges" });
// 	}
// };

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    // Verify admin exists and has admin privileges
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true,
        roles: {
          include: { role: true }
        }
      }
    });

    if (!admin) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Verify user is actually an admin
    // const isAdmin = admin.roles.some(r => r.role.name === 'admin');
    // if (!isAdmin) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     error: "User is not an administrator" 
    //   });
    // }

    // Transaction to delete all related records
    const result = await prisma.$transaction([
      // Delete admin-specific relationships first
      prisma.adminProfile.deleteMany({ where: { userId } }),
      prisma.userRole.deleteMany({ where: { userId } }),
      
      // Delete generic user relationships
      prisma.verificationCode.deleteMany({ where: { userId } }),
      prisma.cart.deleteMany({ where: { userId } }),
      prisma.address.deleteMany({ where: { userId } }),
      
      // Finally delete the user
      prisma.user.delete({ where: { id: userId } })
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin user permanently deleted",
      userId: userId
    });

  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete admin user",
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
};

export { deleteAdmin };
