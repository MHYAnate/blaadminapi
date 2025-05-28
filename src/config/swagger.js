// config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { schemas } from './schemas.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuyLocal Api',
      version: '1.0.0',
      description: 'API documentation for BuyLocal',
      contact: {
        name: 'API Support',
        email: 'support@buylocal.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://buylocalapi-staging.up.railway.app/api',
        description: 'Staging server',
      },
      {
        url: 'https://buylocalapi-production.up.railway.app/api',
        description: 'Production server',
      },
    ],
    components: {
      ...schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/**/*.js'],
};

const specs = swaggerJsdoc(options);

export default (app) => {
  // Swagger UI with authorization persistence
  app.use('/api-docs', swaggerUi.serve, 
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true, 
        tryItOutEnabled: true, 
      },
      customSiteTitle: "BuyLocal API Documentation",
    })
  );
  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};