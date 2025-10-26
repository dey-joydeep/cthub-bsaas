import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import type { OpenAPIV3 } from 'openapi-types';

// Generate Swagger specification
const generateSwaggerSpecs = (): OpenAPIV3.Document => {
  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Beauty SaaS API',
        version: '1.0.0',
        description: 'API documentation for Beauty SaaS application',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/**/*.ts')],
  };

  return swaggerJsdoc(options) as OpenAPIV3.Document;
};

const specs = generateSwaggerSpecs();

// Export specs for use in tests and other modules
export const getSwaggerSpecs = (): OpenAPIV3.Document => specs;

export const setupSwagger = (app: Express): { specs: OpenAPIV3.Document } => {
  // Generate OpenAPI spec file (optional)
  if (process.env.NODE_ENV === 'development') {
    const outputFile = path.join(process.cwd(), 'openapi-spec.json');
    fs.writeFileSync(outputFile, JSON.stringify(specs, null, 2));
    console.log(`📝 OpenAPI spec generated at ${outputFile}`);
  }

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  // Serve Swagger JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger docs available at /api-docs');

  return { specs };
};
