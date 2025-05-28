// config/schemas.js
// export const schemas = {
//   DashboardMetrics: {
//     type: 'object',
//     properties: {
//         total_revenue: {
//             $ref: '#/components/schemas/MetricWithChange'
//         },
//         total_profits: {
//             $ref: '#/components/schemas/MetricWithChange'
//         },
//         total_orders: {
//             $ref: '#/components/schemas/MetricWithChange'
//         },
//         total_customers: {
//             $ref: '#/components/schemas/MetricWithChange'
//         },
//         sales_performance: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/SalesDataPoint'
//             }
//         },
//         order_summary: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/OrderStatusCount'
//             }
//         },
//         top_selling_products: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/TopProduct'
//             }
//         },
//         top_customers: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/TopCustomer'
//             }
//         },
//         recent_customers: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/RecentCustomer'
//             }
//         },
//         inventory_alerts: {
//             type: 'array',
//             items: {
//                 $ref: '#/components/schemas/InventoryAlert'
//             }
//         }
//     }
//   },

//   MetricWithChange: {
//       type: 'object',
//       properties: {
//           value: {
//               type: 'number',
//               format: 'float',
//               example: 125000.50
//           },
//           increase_percentage: {
//               type: 'number',
//               format: 'float',
//               example: 15.5
//           },
//           trend: {
//               type: 'string',
//               enum: ['up', 'down', 'neutral'],
//               example: 'up'
//           }
//       }
//   },

//   SalesDataPoint: {
//       type: 'object',
//       properties: {
//           period: {
//               type: 'string',
//               example: '2023-05'
//           },
//           total_sales: {
//               type: 'number',
//               format: 'float',
//               example: 25000.75
//           },
//           orders_count: {
//               type: 'integer',
//               example: 125
//           }
//       }
//   },

//   OrderStatusCount: {
//       type: 'object',
//       properties: {
//           status: {
//               type: 'string',
//               enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
//               example: 'DELIVERED'
//           },
//           count: {
//               type: 'integer',
//               example: 45
//           },
//           percentage: {
//               type: 'number',
//               format: 'float',
//               example: 62.5
//           }
//       }
//   },

//   TopProduct: {
//       type: 'object',
//       properties: {
//           productId: {
//               type: 'string',
//               example: '64a1b5a5e99d1a2b3c4d5e7f'
//           },
//           name: {
//               type: 'string',
//               example: 'Premium Widget'
//           },
//           sales: {
//               type: 'integer',
//               example: 125
//           },
//           revenue: {
//               type: 'number',
//               format: 'float',
//               example: 2500.75
//           },
//           image: {
//               type: 'string',
//               format: 'uri',
//               example: 'https://example.com/product.jpg'
//           }
//       }
//   },

//   TopCustomer: {
//       type: 'object',
//       properties: {
//           customerId: {
//               type: 'string',
//               example: '67f1b5a5e99d1a2b3c4d5f2f'
//           },
//           email: {
//               type: 'string',
//               format: 'email',
//               example: 'customer@example.com'
//           },
//           name: {
//               type: 'string',
//               example: 'John Doe'
//           },
//           total_spent: {
//               type: 'number',
//               format: 'float',
//               example: 5000.75
//           },
//           orders_count: {
//               type: 'integer',
//               example: 12
//           },
//           last_order_date: {
//               type: 'string',
//               format: 'date-time'
//           }
//       }
//   },

//   RecentCustomer: {
//       type: 'object',
//       properties: {
//           customerId: {
//               type: 'string',
//               example: '67f1b5a5e99d1a2b3c4d5f2f'
//           },
//           email: {
//               type: 'string',
//               format: 'email',
//               example: 'new@customer.com'
//           },
//           name: {
//               type: 'string',
//               example: 'John Doe'
//           },
//           type: {
//               type: 'string',
//               enum: ['INDIVIDUAL', 'BUSINESS'],
//               example: 'INDIVIDUAL'
//           },
//           join_date: {
//               type: 'string',
//               format: 'date-time'
//           },
//           kyc_status: {
//               type: 'string',
//               enum: ['VERIFIED', 'PENDING', 'UNVERIFIED'],
//               example: 'VERIFIED'
//           }
//       }
//   },

//   InventoryAlert: {
//     type: 'object',
//     properties: {
//         productId: {
//             type: 'string',
//             example: '64a1b5a5e99d1a2b3c4d5e7f'
//         },
//         optionId: {
//             type: 'string',
//             example: '65c1b5a5e99d1a2b3c4d5e9f'
//         },
//         name: {
//             type: 'string',
//             example: 'Premium Widget (Large)'
//         },
//         current_stock: {
//             type: 'integer',
//             example: 5
//         },
//         threshold: {
//             type: 'integer',
//             example: 10
//         },
//         status: {
//             type: 'string',
//             enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'STOCK_OK'],
//             example: 'LOW_STOCK'
//         },
//         last_restock_date: {
//             type: 'string',
//             format: 'date-time',
//             nullable: true
//         }
//     }
//   },
//   Manufacturer: {
//     type: 'object',
//     properties: {
//       id: {
//         type: 'string',
//         example: '63b5b5a5e99d1a2b3c4d5e6f'
//       },
//       name: {
//         type: 'string',
//         example: 'Acme Corporation'
//       },
//       country: {
//         type: 'string',
//         example: 'United States'
//       },
//       logo: {
//         type: 'string',
//         example: 'https://example.com/logo.png'
//       },
//       email: {
//         type: 'string',
//         format: 'email',
//         example: 'contact@acme.com'
//       },
//       phone: {
//         type: 'string',
//         example: '+1234567890'
//       },
//       contactPerson: {
//         type: 'string',
//         example: 'John Doe'
//       },
//       status: {
//         type: 'boolean',
//         example: true
//       },
//       createdAt: {
//         type: 'string',
//         format: 'date-time'
//       },
//       updatedAt: {
//         type: 'string',
//         format: 'date-time'
//       }
//     }
//   },
//   ManufacturerInput: {
//     type: 'object',
//     required: ['name', 'country', 'email', 'contactPerson'],
//     properties: {
//       name: {
//         type: 'string',
//         example: 'Acme Corporation'
//       },
//       country: {
//         type: 'string',
//         example: 'United States'
//       },
//       logo: {
//         type: 'string',
//         example: 'https://example.com/logo.png'
//       },
//       email: {
//         type: 'string',
//         format: 'email',
//         example: 'contact@acme.com'
//       },
//       phone: {
//         type: 'string',
//         example: '+1234567890'
//       },
//       contactPerson: {
//         type: 'string',
//         example: 'John Doe'
//       }
//     }
//   },

//   ProductInput: {
//     type: 'object',
//     required: ['name', 'description', 'categoryId', 'manufacturerId', 'options'],
//     properties: {
//       name: {
//         type: 'string',
//         example: 'Premium Widget'
//       },
//       description: {
//         type: 'string',
//         example: 'High-quality widget with multiple options'
//       },
//       categoryId: {
//         type: 'string',
//         example: '64a1b5a5e99d1a2b3c4d5e8f'
//       },
//       manufacturerId: {
//         type: 'string',
//         example: '63b5b5a5e99d1a2b3c4d5e6f'
//       },
//       type: {
//         type: 'string',
//         enum: ['platform', 'service'],
//         example: 'platform'
//       },
//       options: {
//         type: 'array',
//         items: {
//           $ref: '#/components/schemas/ProductOptionInput'
//         }
//       }
//     }
//   },

//   ProductOptionInput: {
//     type: 'object',
//     required: ['value', 'stockPrice', 'sellingPrice'],
//     properties: {
//       value: {
//         type: 'string',
//         example: 'Large'
//       },
//       weight: {
//         type: 'number',
//         format: 'float',
//         example: 1.5
//       },
//       stockPrice: {
//         type: 'number',
//         format: 'float',
//         example: 10.99
//       },
//       sellingPrice: {
//         type: 'number',
//         format: 'float',
//         example: 15.99
//       },
//       markupType: {
//         type: 'string',
//         enum: ['FIXED', 'PERCENTAGE'],
//         example: 'PERCENTAGE'
//       },
//       markupValue: {
//         type: 'number',
//         format: 'float',
//         example: 45.5
//       },
//       price: {
//         type: 'number',
//         format: 'float',
//         example: 15.99
//       },
//       moq: {
//         type: 'integer',
//         example: 10
//       },
//       unit: {
//         type: 'string',
//         example: 'kg'
//       },
//       image: {
//         type: 'array',
//         items: {
//           type: 'string',
//           format: 'uri',
//           example: 'https://example.com/image1.jpg'
//         }
//       },
//       inventory: {
//         type: 'integer',
//         example: 100
//       },
//       lowStockThreshold: {
//         type: 'integer',
//         example: 10
//       }
//     }
//   },

//   Category: {
//     type: 'object',
//     properties: {
//       id: {
//         type: 'string',
//         example: '64a1b5a5e99d1a2b3c4d5e8f'
//       },
//       name: {
//         type: 'string',
//         example: 'Electronics'
//       },
//       description: {
//         type: 'string',
//         example: 'Electronic devices and components'
//       },
//       createdAt: {
//         type: 'string',
//         format: 'date-time'
//       },
//       updatedAt: {
//         type: 'string',
//         format: 'date-time'
//       }
//     }
//   },

//   OrderDetails: {
//     allOf: [
//       { $ref: '#/components/schemas/Order' },
//       {
//         type: 'object',
//         properties: {
//           customer: { $ref: '#/components/schemas/Customer' },
//           items: {
//             type: 'array',
//             items: { $ref: '#/components/schemas/OrderItem' }
//           },
//           shippingAddress: { $ref: '#/components/schemas/Address' },
//           billingAddress: { $ref: '#/components/schemas/Address' }
//         }
//       }
//     ]
//   },
//   OrderItem: {
//     type: 'object',
//     properties: {
//       id: {
//         type: 'string',
//         example: '66e1b5a5e99d1a2b3c4d5f1f'
//       },
//       product: {
//         $ref: '#/components/schemas/Product'
//       },
//       option: {
//         $ref: '#/components/schemas/ProductOption'
//       },
//       quantity: {
//         type: 'integer',
//         example: 2
//       },
//       unitPrice: {
//         type: 'number',
//         format: 'float',
//         example: 15.99
//       },
//       totalPrice: {
//         type: 'number',
//         format: 'float',
//         example: 31.98
//       }
//     }
//   },
//   Customer: {
//     type: 'object',
//     properties: {
//       id: {
//         type: 'string',
//         example: '67f1b5a5e99d1a2b3c4d5f2f'
//       },
//       email: {
//         type: 'string',
//         format: 'email',
//         example: 'customer@example.com'
//       },
//       name: {
//         type: 'string',
//         example: 'John Doe'
//       },
//       phone: {
//         type: 'string',
//         example: '+1234567890'
//       }
//     }
//   },
//   Address: {
//     type: 'object',
//     properties: {
//       street: {
//         type: 'string',
//         example: '123 Main St'
//       },
//       city: {
//         type: 'string',
//         example: 'New York'
//       },
//       state: {
//         type: 'string',
//         example: 'NY'
//       },
//       postalCode: {
//         type: 'string',
//         example: '10001'
//       },
//       country: {
//         type: 'string',
//         example: 'United States'
//       }
//     }
//   },
//   ProductSales: {
//     type: 'object',
//     properties: {
//       productId: { 
//         type: 'string',
//         example: '64a1b5a5e99d1a2b3c4d5e7f'
//       },
//       name: { 
//         type: 'string',
//         example: 'Premium Widget'
//       },
//       quantitySold: { 
//         type: 'integer',
//         example: 125
//       },
//       totalRevenue: { 
//         type: 'number', 
//         format: 'float',
//         example: 2500.75
//       }
//     }
//   },
//   Refund: {
//     type: 'object',
//     properties: {
//       id: { 
//         type: 'string',
//         example: '68g1b5a5e99d1a2b3c4d5f3f'
//       },
//       orderId: { 
//         type: 'string',
//         example: '65d1b5a5e99d1a2b3c4d5f0f'
//       },
//       amount: { 
//         type: 'number', 
//         format: 'float',
//         example: 125.99
//       },
//       reason: { 
//         type: 'string',
//         example: 'Customer request'
//       },
//       status: {
//         type: 'string',
//         enum: ['PENDING', 'PROCESSED', 'DECLINED'],
//         example: 'PROCESSED'
//       },
//       processedAt: { 
//         type: 'string', 
//         format: 'date-time'
//       }
//     }
//   },
//   DashboardReport: {
//     type: 'object',
//     properties: {
//       success: {
//         type: 'boolean',
//         example: true
//       },
//       metrics: {
//         type: 'object',
//         properties: {
//           revenue: {
//             $ref: '#/components/schemas/DashboardMetric'
//           },
//           sales: {
//             $ref: '#/components/schemas/DashboardMetric'
//           },
//           profit: {
//             $ref: '#/components/schemas/DashboardMetric'
//           }
//         }
//       },
//       charts: {
//         type: 'object',
//         properties: {
//           revenueTrend: {
//             type: 'array',
//             items: {
//               $ref: '#/components/schemas/TrendDataPoint'
//             }
//           },
//           orderTrend: {
//             type: 'array',
//             items: {
//               $ref: '#/components/schemas/TrendDataPoint'
//             }
//           }
//         }
//       },
//       lastUpdated: {
//         type: 'string',
//         format: 'date-time'
//       }
//     }
//   },
//   DashboardMetric: {
//     type: 'object',
//     properties: {
//       value: {
//         type: 'number',
//         format: 'float',
//         example: 12500.50
//       },
//       dailyChange: {
//         type: 'number',
//         format: 'float',
//         example: 12.5
//       },
//       trend: {
//         type: 'string',
//         enum: ['up', 'down'],
//         example: 'up'
//       }
//     }
//   },
//   TrendDataPoint: {
//     type: 'object',
//     properties: {
//       month: {
//         type: 'string',
//         example: '2023-05'
//       },
//       day: {
//         type: 'string',
//         example: 'Mon'
//       },
//       value: {
//         type: 'number',
//         example: 2500
//       }
//     }
//   },
//   CustomerProfile: {
//           type: 'object',
//           properties: {
//             fullName: { 
//               type: 'string',
//               example: 'John Doe' 
//             },
//             address: { 
//               type: 'string',
//               example: '123 Main St' 
//             },
//             dob: { 
//               type: 'string',
//               format: 'date-time',
//               example: '1990-01-01T00:00:00Z' 
//             },
//             howDidYouHear: { 
//               type: 'string',
//               example: 'Friend' 
//             },
//             deliveryPhone: { 
//               type: 'string',
//               example: '+1234567890' 
//             }
//           }
//   },
  
//   BusinessProfile: {
//           type: 'object',
//           properties: {
//             businessName: { 
//               type: 'string',
//               example: 'Acme Corp' 
//             },
//             businessAddress: { 
//               type: 'string',
//               example: '456 Business Ave' 
//             },
//             cacNumber: { 
//               type: 'string',
//               example: 'RC123456' 
//             },
//             businessPhone: { 
//               type: 'string',
//               example: '+1234567890' 
//             }
//           }
//   },
  
//   Pagination: {
//           type: 'object',
//           properties: {
//             totalItems: { 
//               type: 'integer',
//               example: 100 
//             },
//             totalPages: { 
//               type: 'integer',
//               example: 10 
//             },
//             currentPage: { 
//               type: 'integer',
//               example: 1 
//             },
//             pageSize: { 
//               type: 'integer',
//               example: 10 
//             },
//             hasNextPage: { 
//               type: 'boolean',
//               example: true 
//             },
//             hasPreviousPage: { 
//               type: 'boolean',
//               example: false 
//             }
//           }
//   },
  
//   OrderSummary: {
//           type: 'object',
//           properties: {
//             totalOrders: { 
//               type: 'integer',
//               example: 5 
//             },
//             totalSpent: { 
//               type: 'number',
//               format: 'float',
//               example: 1250.50 
//             },
//             lastOrderDate: { 
//               type: 'string',
//               format: 'date-time',
//               example: '2023-05-15T10:30:00Z' 
//             }
//           }
//   },
  
//   CategorizedOrders: {
//           type: 'object',
//           properties: {
//             completed: {
//               type: 'array',
//               items: { $ref: '#/components/schemas/Order' }
//             },
//             processing: {
//               type: 'array',
//               items: { $ref: '#/components/schemas/Order' }
//             },
//             cancelled: {
//               type: 'array',
//               items: { $ref: '#/components/schemas/Order' }
//             }
//           }
//   },
  
//   Order: {
//           type: 'object',
//           properties: {
//             id: { 
//               type: 'integer',
//               example: 1 
//             },
//             status: { 
//               type: 'string',
//               example: 'completed' 
//             },
//             totalAmount: { 
//               type: 'number',
//               format: 'float',
//               example: 250.50 
//             },
//             createdAt: { 
//               type: 'string',
//               format: 'date-time',
//               example: '2023-05-15T10:30:00Z' 
//             }
//           }
//   },

//   // product schemas

//   Product: {
//     type: 'object',
//     properties: {
//       id: { 
//         type: 'integer', 
//         description: 'The product ID',
//         example: 1
//       },
//       name: { 
//         type: 'string', 
//         description: 'Product name',
//         example: 'Premium Widget'
//       },
//       description: { 
//         type: 'string', 
//         description: 'Product description',
//         example: 'High-quality widget with multiple options'
//       },
//       type: {
//         type: 'string',
//         enum: ['platform', 'service'],
//         description: 'Product type',
//         example: 'platform'
//       },
//       isActive: {
//         type: 'boolean',
//         description: 'Whether the product is available',
//         example: true
//       },
//       createdAt: {
//         type: 'string',
//         format: 'date-time',
//         description: 'When the product was created',
//         example: '2023-05-15T10:30:00Z'
//       },
//       updatedAt: {
//         type: 'string',
//         format: 'date-time',
//         description: 'When the product was last updated',
//         example: '2023-05-16T08:15:00Z'
//       },
//       category: {
//         $ref: '#/components/schemas/Category'
//       },
//       manufacturer: {
//         $ref: '#/components/schemas/Manufacturer'
//       },
//       options: {
//         type: 'array',
//         items: {
//           $ref: '#/components/schemas/ProductOption'
//         }
//       }
//     }
//   },

//   ProductOption: {
//     type: 'object',
//     properties: {
//       id: { 
//         type: 'string', 
//         description: 'The option ID',
//         example: '65c1b5a5e99d1a2b3c4d5e9f'
//       },
//       value: { 
//         type: 'string', 
//         description: 'Option value/name',
//         example: 'Large'
//       },
//       weight: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Weight of this option',
//         example: 1.5
//       },
//       stockPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Base cost price',
//         example: 10.99
//       },
//       sellingPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Final selling price',
//         example: 15.99
//       },
//       markupType: {
//         type: 'string',
//         enum: ['FIXED', 'PERCENTAGE'],
//         description: 'Type of markup applied',
//         example: 'PERCENTAGE'
//       },
//       markupValue: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Amount or percentage of markup',
//         example: 45.5
//       },
//       moq: { 
//         type: 'integer',
//         description: 'Minimum order quantity',
//         example: 10
//       },
//       unit: { 
//         type: 'string',
//         description: 'Unit of measurement',
//         example: 'kg'
//       },
//       image: {
//         type: 'array',
//         description: 'List of image URLs',
//         items: { 
//           type: 'string', 
//           format: 'uri',
//           example: 'https://example.com/image1.jpg'
//         }
//       },
//       inventory: { 
//         type: 'integer',
//         description: 'Current stock level',
//         example: 100
//       },
//       lowStockThreshold: { 
//         type: 'integer',
//         description: 'Stock level that triggers low stock alerts',
//         example: 10
//       },
//       createdAt: {
//         type: 'string',
//         format: 'date-time',
//         description: 'When the option was created'
//       },
//       updatedAt: {
//         type: 'string',
//         format: 'date-time',
//         description: 'When the option was last updated'
//       }
//     }
//   },

//   ProductCreate: {
//     type: 'object',
//     required: ['name', 'description', 'categoryId', 'manufacturerId', 'options'],
//     properties: {
//       name: { 
//         type: 'string',
//         description: 'Product name',
//         example: 'Premium Widget'
//       },
//       description: { 
//         type: 'string',
//         description: 'Detailed product description',
//         example: 'High-quality widget with multiple options'
//       },
//       categoryId: { 
//         type: 'integer',
//         description: 'ID of the category this product belongs to',
//         example: 1
//       },
//       manufacturerId: { 
//         type: 'integer',
//         description: 'ID of the manufacturer',
//         example: 2
//       },
//       type: {
//         type: 'string',
//         enum: ['platform', 'service'],
//         description: 'Product type',
//         default: 'platform',
//         example: 'platform'
//       },
//       isActive: {
//         type: 'boolean',
//         description: 'Whether the product should be active',
//         default: true,
//         example: true
//       },
//       options: {
//         type: 'array',
//         description: 'List of product options/variants',
//         items: {
//           $ref: '#/components/schemas/ProductOptionCreate'
//         }
//       }
//     }
//   },

//   ProductOptionCreate: {
//     type: 'object',
//     required: ['value'],
//     properties: {
//       value: { 
//         type: 'string',
//         description: 'Option name/value',
//         example: 'Red'
//       },
//       weight: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Weight for this option',
//         example: 1.5
//       },
//       stockPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Base cost price',
//         example: 10.0
//       },
//       sellingPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Final selling price',
//         example: 12.0
//       },
//       markupType: {
//         type: 'string',
//         enum: ['FIXED', 'PERCENTAGE'],
//         description: 'Type of markup to apply',
//         example: 'FIXED'
//       },
//       markupValue: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Amount or percentage of markup',
//         example: 2.0
//       },
//       moq: { 
//         type: 'integer',
//         description: 'Minimum order quantity',
//         example: 5
//       },
//       unit: { 
//         type: 'string',
//         description: 'Unit of measurement',
//         example: 'kg'
//       },
//       image: {
//         type: 'array',
//         description: 'List of image URLs for this option',
//         items: {
//           type: 'string',
//           format: 'uri',
//           example: 'https://example.com/image1.jpg'
//         }
//       },
//       inventory: { 
//         type: 'integer',
//         description: 'Initial stock level',
//         example: 50
//       },
//       lowStockThreshold: { 
//         type: 'integer',
//         description: 'Stock level that triggers low stock alerts',
//         example: 5
//       }
//     }
//   },

//   ProductUpdate: {
//     type: 'object',
//     properties: {
//       name: { 
//         type: 'string',
//         description: 'Updated product name',
//         example: 'Premium Widget Pro'
//       },
//       description: { 
//         type: 'string',
//         description: 'Updated product description',
//         example: 'Improved version of our premium widget'
//       },
//       categoryId: { 
//         type: 'integer',
//         description: 'Updated category ID',
//         example: 3
//       },
//       manufacturerId: { 
//         type: 'integer',
//         description: 'Updated manufacturer ID',
//         example: 4
//       },
//       type: {
//         type: 'string',
//         enum: ['platform', 'service'],
//         description: 'Updated product type',
//         example: 'platform'
//       },
//       isActive: {
//         type: 'boolean',
//         description: 'Updated active status',
//         example: true
//       },
//       options: {
//         type: 'array',
//         description: 'Updated list of product options',
//         items: {
//           $ref: '#/components/schemas/ProductOptionUpdate'
//         }
//       }
//     }
//   },

//   ProductOptionUpdate: {
//     type: 'object',
//     properties: {
//       id: { 
//         type: 'string',
//         description: 'Existing option ID (required for updates)',
//         example: '65c1b5a5e99d1a2b3c4d5e9f'
//       },
//       value: { 
//         type: 'string',
//         description: 'Updated option name/value',
//         example: 'Blue'
//       },
//       weight: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Updated weight',
//         example: 1.2
//       },
//       stockPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Updated base cost price',
//         example: 11.0
//       },
//       sellingPrice: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Updated selling price',
//         example: 13.5
//       },
//       markupType: {
//         type: 'string',
//         enum: ['FIXED', 'PERCENTAGE'],
//         description: 'Updated markup type',
//         example: 'PERCENTAGE'
//       },
//       markupValue: { 
//         type: 'number', 
//         format: 'float',
//         description: 'Updated markup value',
//         example: 22.5
//       },
//       moq: { 
//         type: 'integer',
//         description: 'Updated minimum order quantity',
//         example: 8
//       },
//       unit: { 
//         type: 'string',
//         description: 'Updated unit of measurement',
//         example: 'kg'
//       },
//       image: {
//         type: 'array',
//         description: 'Updated list of image URLs',
//         items: {
//           type: 'string',
//           format: 'uri',
//           example: 'https://example.com/image2.jpg'
//         }
//       },
//       inventory: { 
//         type: 'integer',
//         description: 'Updated stock level',
//         example: 75
//       },
//       lowStockThreshold: { 
//         type: 'integer',
//         description: 'Updated low stock threshold',
//         example: 8
//       }
//     }
//   },


//   securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT'
//         }
//   },

//   responses: {
//     Unauthorized: {
//       description: 'Unauthorized - Missing or invalid authentication',
//       content: {
//         'application/json': {
//           schema: {
//             type: 'object',
//             properties: {
//               message: { 
//                 type: 'string',
//                 example: 'Unauthorized' 
//               }
//             }
//           }
//         }
//       }
//     },
//     Forbidden: {
//       description: 'Forbidden - Insufficient permissions',
//       content: {
//         'application/json': {
//           schema: {
//             type: 'object',
//             properties: {
//               message: { 
//                 type: 'string',
//                 example: 'Forbidden' 
//               }
//             }
//           }
//         }
//       }
//     },
//     ServerError: {
//       description: 'Internal server error',
//       content: {
//         'application/json': {
//           schema: {
//             type: 'object',
//             properties: {
//               message: { 
//                 type: 'string',
//                 example: 'Internal server error' 
//               }
//             }
//           }
//         }
//       }
//     }
//   },
//     AdminUser: {
//       type: 'object',
//       properties: {
//         id: { type: 'integer', example: 1 },
//         email: { type: 'string', format: 'email', example: 'admin@example.com' },
//         firstName: { type: 'string', example: 'John' },
//         lastName: { type: 'string', example: 'Doe' },
//         status: { 
//           type: 'string', 
//           enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
//           example: 'ACTIVE'
//         },
//         createdAt: { type: 'string', format: 'date-time' },
//         roles: {
//           type: 'array',
//           items: { $ref: '#/components/schemas/Role' }
//         }
//       }
//     },
  
//     Role: {
//       type: 'object',
//       properties: {
//         id: { type: 'integer', example: 1 },
//         name: { type: 'string', example: 'Admin' },
//         description: { type: 'string', example: 'Administrator role' }
//       }
//     },
  
//     AdminInviteRequest: {
//       type: 'object',
//       required: ['email', 'roleNames'],
//       properties: {
//         email: { type: 'string', format: 'email', example: 'admin@example.com' },
//         roleNames: {
//           type: 'array',
//           items: {
//             type: 'string',
//             enum: ['Super Admin', 'Admin', 'Content Manager', 'Order Manager']
//           },
//           example: ['Admin']
//         }
//       }
//     },
  
//     AdminRolesUpdate: {
//       type: 'object',
//       required: ['roleNames'],
//       properties: {
//         roleNames: {
//           type: 'array',
//           items: {
//             type: 'string',
//             enum: ['Super Admin', 'Admin', 'Content Manager', 'Order Manager']
//           },
//           example: ['Admin', 'Content Manager']
//         }
//       }
//     }
// }

export const schemas = {
  
}