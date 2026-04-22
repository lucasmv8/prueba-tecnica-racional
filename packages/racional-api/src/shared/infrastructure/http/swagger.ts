import swaggerJsdoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Racional Investment API',
      version: '1.0.0',
      description:
        'API para gestión de portafolios de inversión: depósitos, retiros, órdenes de compra/venta y seguimiento en tiempo real.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de Supabase Auth',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            full_name: { type: 'string' },
            phone: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Portfolio: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            currency: { type: 'string', example: 'USD' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            portfolio_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
            amount: { type: 'string', description: 'Decimal as string for precision' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            portfolio_id: { type: 'string', format: 'uuid' },
            stock_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['BUY', 'SELL'] },
            quantity: { type: 'string', description: 'Decimal as string' },
            price_per_unit: { type: 'string', description: 'Decimal as string' },
            total_amount: { type: 'string', description: 'Decimal as string' },
            date: { type: 'string', format: 'date-time' },
            ticker: { type: 'string', example: 'AAPL' },
          },
        },
        Movement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            kind: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL'] },
            amount: { type: 'string', description: 'Decimal as string' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string', nullable: true },
            ticker: { type: 'string', nullable: true, description: 'Only for orders' },
            quantity: { type: 'string', nullable: true, description: 'Only for orders' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/**/infrastructure/*.router.ts'],
})
