// scripts/uploadProducts.js
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // 1. Read Excel file
    const filePath = path.join(__dirname, 'products.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    // Process each sheet
    // await processManufacturers(workbook);
    // await processCategories(workbook);
    await processProducts(workbook);
    await processProductOptions(workbook);

    console.log('✅ All data processed successfully');
  } catch (error) {
    console.error('🚨 Main processing error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

  async function processManufacturers(workbook) {
    try {
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('manufacturers')
      );
      if (!sheetName) {
        console.log('ℹ️ No manufacturers sheet found');
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      // const data = XLSX.utils.sheet_to_json(worksheet);
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,        
        blankrows: false,    
        header: ['manufacturer_name', 'country', 'email', 'phone', 'contact_person', 'logo'],
        range: 1             
      });

      console.log(data);

      if (!data.length) {
        console.log('ℹ️ No data in manufacturers sheet');
        return;
      }

      console.log(`Processing ${data.length} manufacturers...`);
      
      for (const [index, row] of data.entries()) {
        try {
          
          // Validate required fields
          if (!row.manufacturer_name) {
            console.error(`❌ Row ${index + 1}: Manufacturer name is required`);
            continue;
          }

          const manufacturerData = {
            name: row.manufacturer_name.trim(),
            country: row.country?.trim() || '',
            email: row.email?.trim() || null,
            phone: row.phone ? formatPhoneNumber(row.phone) : null,
            contactPerson: row.contact_person?.trim() || null,
            logo: row.logo?.trim() || null,
            status: true
          };

          // Additional validation if needed
          if (manufacturerData.email && ! isValidEmail(manufacturerData.email)) {
            console.error(`❌ ${manufacturerData.name}: Invalid email format`);
            manufacturerData.email = null; // Or handle differently
          }

          const manufacturer = await prisma.manufacturer.upsert({
            where: { name: manufacturerData.name },
            create: manufacturerData,
            update: manufacturerData
          });

          console.log(`✅ Processed manufacturer: ${manufacturer.name} (ID: ${manufacturer.id})`);
        } catch (error) {
          // console.error(`❌ Error processing row ${index + 1} (${row.manufacturer_name || 'unnamed'}):`, error.message);
          // Optional: Log the full row for debugging
          // console.error('Problematic row:', row);
        }
      }
    } catch (error) {
      console.error('🚨 Error processing manufacturers:', error);
      throw error; // Re-throw if you want calling code to handle it
    }
  }

  // Helper function for email validation
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function processCategories(workbook) {
    try {
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('categories')
      );
      
      if (!sheetName) {
        console.log('ℹ️ No categories sheet found');
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data.length) {
        console.log('ℹ️ No data in categories sheet');
        return;
      }

      console.log(`Processing ${data.length} categories...`);
      
      for (const row of data) {
        try {

          // First try to find the category
          const existing = await prisma.category.findFirst({
            where: { name: row.category_name }
          });

          if (existing) {
            // Update if needed
            await prisma.category.update({
              where: { id: existing.id },
              data: {
                name: row.category_name
              } // Add any fields you want to update
            });
            console.log(`✅ Updated category: ${row.category_name}`);
          } else {
            // Create if doesn't exist
            await prisma.category.create({
              data: { name: row.category_name }
            });
            console.log(`✅ Created category: ${row.category_name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing category ${row.category_name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('🚨 Error processing categories:', error);
    }
  }

  async function processProducts(workbook) {
    try {
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('products') && 
        !name.toLowerCase().includes('options')
      );
      
      if (!sheetName) {
        console.log('ℹ️ No products sheet found');
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      // Convert to JSON with header mapping, skipping empty rows
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,        
        blankrows: false,    
        header: ['name', 'description', 'isActive', 'type', 'category', 'manufacturer'],
        range: 1             
      });
    
      // console.log(data);

      if (!data.length) {
        console.log('ℹ️ No data in products sheet');
        return;
      }

      console.log(`Processing ${data.length} products...`);
      
      for (const row of data) {
        try {
          // Validate required fields
          if (!row.name || typeof row.name !== 'string') {
            console.warn(`⚠️ Skipping product - Missing or invalid name:`, row);
            continue;
          }

          // Find category and manufacturer
          const category = await prisma.category.findFirst({
            where: { name: row.category }
          });
          
          const manufacturer = await prisma.manufacturer.findFirst({
            where: { name: row.manufacturer }
          });

          if (!category || !manufacturer) {
            console.warn(`⚠️ Skipping product ${row.name} - ${!category ? 'Category' : 'Manufacturer'} not found`);
            continue;
          }

          const productData = {
            name: row.name,
            description: row.description || '',
            isActive: row.isActive !== undefined ? row.isActive : true,
            type: row.type || 'platform',
            category: { connect: { id: category.id } },
            manufacturer: { connect: { id: manufacturer.id } }
          };


          // Using find + create/update pattern
          const existing = await prisma.product.findFirst({
            where: { name: row.name }
          });

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: productData
            });
            console.log(`✅ Updated product: ${row.name}`);
          } else {
            await prisma.product.create({
              data: productData
            });
            console.log(`✅ Created product: ${row.name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing product ${row.name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('🚨 Error processing products:', error);
    }
  }

  async function processProductOptions(workbook) {
    try {
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('option')
      );
      
      if (!sheetName) {
        console.log('ℹ️ No product options sheet found');
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (!data.length) {
        console.log('ℹ️ No data in product options sheet');
        return;
      }

      console.log(`Processing ${data.length} product options...`);

      for (const row of data) {
        try {
          // Find the product
          const product = await prisma.product.findFirst({
            where: { name: row.product_name }
          });
          
          if (!product) {
            console.warn(`⚠️ Product not found: ${row.product_name}. Skipping option`);
            continue;
          }

          // Calculate price with proper null checks
          const stockPrice = parseFloat(row.stock_price) || 0;
          let price = stockPrice;

          if (row.markup_type && row.markup_value) {
            const markupValue = parseFloat(row.markup_value) || 0;
            price = row.markup_type.toLowerCase() === 'percentage'
              ? stockPrice * (1 + (markupValue / 100))
              : stockPrice + markupValue;
          }

          // Process image URLs with validation
          const imageUrls = (row.image_urls || '')
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);


            // Prepare option data
            const optionData = {
              value: row.option_value,
              weight: parseFloat(row.weight) || 0,
              stockPrice: stockPrice,
              sellingPrice: parseFloat(row.selling_price) || price,
              markupType: row.markup_type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
              markupValue: parseFloat(row.markup_value) || 0,
              price: price,
              moq: parseInt(row.moq) || 1,
              image: imageUrls,
              unit: row.unit || 'unit',
              inventory: parseInt(row.inventory) || 0,
              lowStockThreshold: parseInt(row.low_stock_threshold) || 10,
              productId: product.id
            };

          // First try to find existing option
          const existingOption = await prisma.productOption.findFirst({
            where: {
              productId: product.id,
              value: row.option_value
            }
          });
          
          if (existingOption) {
            // Update existing option
            const updatedOption = await prisma.productOption.update({
              where: { id: existingOption.id },
              data: optionData
            });
            console.log(`✅ Updated option: ${product.name} - ${updatedOption.value}`);
          } else {
            // Create new option
            const newOption = await prisma.productOption.create({
              data: optionData
            });
            console.log(`✅ Created option: ${product.name} - ${newOption.value}`);
          }

        } catch (error) {
          console.error(`❌ Error processing option for product ${row.product_name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('🚨 Error processing product options:', error);
    }
  }


  function formatPhoneNumber(phone) {
    if (!phone) return null;
    const numString = "0" + String(phone).replace(/\D/g, '');
    return numString.length > 0 ? numString : null;
  }


main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});