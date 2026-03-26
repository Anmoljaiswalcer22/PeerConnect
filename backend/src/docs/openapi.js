/**
 * OpenAPI 3 description of the REST API, served at /api/docs.
 * Auth uses the httpOnly `pc_token` cookie: log in through
 * POST /api/auth/login in the docs page and later calls send the cookie automatically.
 */
const error = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const json = (schema) => ({ 'application/json': { schema } });

const data = (properties) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data: { type: 'object', properties } },
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PeerConnect API',
    version: '1.0.0',
    description:
      'REST API for PeerConnect. Messages are persisted through REST; real-time delivery, presence, typing and receipts use Socket.IO (see the README).',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'System' }, { name: 'Auth' }, { name: 'Messages' }],
  components: {
    securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'pc_token' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          profilePic: { type: 'string' },
          lastSeen: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          senderId: { type: 'string' },
          receiverId: { type: 'string' },
          type: { type: 'string', enum: ['text', 'image', 'file'] },
          text: { type: 'string' },
          attachment: {
            type: 'object',
            nullable: true,
            properties: {
              url: { type: 'string' },
              name: { type: 'string' },
              size: { type: 'integer' },
              mimeType: { type: 'string' },
              width: { type: 'integer' },
              height: { type: 'integer' },
            },
          },
          status: { type: 'string', enum: ['sent', 'delivered', 'read'] },
          deliveredAt: { type: 'string', format: 'date-time', nullable: true },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          clientMessageId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Contact: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          profilePic: { type: 'string' },
          lastSeen: { type: 'string', format: 'date-time', nullable: true },
          lastMessage: { $ref: '#/components/schemas/Message' },
          unreadCount: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness and database state',
        responses: { 200: { description: 'Service is running' } },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account and start a session',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['fullName', 'email', 'password'],
            properties: {
              fullName: { type: 'string', example: 'Asha Verma' },
              email: { type: 'string', example: 'asha@example.com' },
              password: { type: 'string', example: 'secret123', description: '8–72 chars, a letter and a number' },
            },
          }),
        },
        responses: {
          201: { description: 'Created; sets the pc_token cookie', content: json(data({ user: { $ref: '#/components/schemas/User' } })) },
          400: error('Validation failed'),
          409: error('Email already registered'),
          429: error('Too many sign-ups from this IP'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'password'],
            properties: { email: { type: 'string' }, password: { type: 'string' } },
          }),
        },
        responses: {
          200: { description: 'Sets the pc_token cookie', content: json(data({ user: { $ref: '#/components/schemas/User' } })) },
          401: error('Invalid email or password'),
          429: error('Too many failed attempts'),
        },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Clear the session cookie', responses: { 200: { description: 'Logged out' } } },
    },
    '/api/auth/check': {
      get: {
        tags: ['Auth'],
        summary: 'Current user (session restore on refresh)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Logged in', content: json(data({ user: { $ref: '#/components/schemas/User' } })) },
          401: error('Not logged in'),
        },
      },
    },
    '/api/auth/socket-token': {
      get: {
        tags: ['Auth'],
        summary: '2-minute token for the Socket.IO handshake',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Token', content: json(data({ token: { type: 'string' } })) }, 401: error('Not logged in') },
      },
    },
    '/api/auth/update-profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update name and/or profile picture',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              profilePic: { type: 'string', description: 'base64 data URI (png/jpeg/webp/gif, max 2 MB)' },
            },
          }),
        },
        responses: {
          200: { description: 'Updated user', content: json(data({ user: { $ref: '#/components/schemas/User' } })) },
          400: error('Validation failed'),
          503: error('Uploads not configured'),
        },
      },
    },
    '/api/messages/users': {
      get: {
        tags: ['Messages'],
        summary: 'Contacts with last message and unread count',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Contacts', content: json(data({ users: { type: 'array', items: { $ref: '#/components/schemas/Contact' } } })) },
        },
      },
    },
    '/api/messages/{id}': {
      get: {
        tags: ['Messages'],
        summary: 'Conversation history with a user (cursor pagination)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Other user id' },
          { name: 'before', in: 'query', schema: { type: 'string' }, description: 'Message id: load older messages' },
          { name: 'after', in: 'query', schema: { type: 'string' }, description: 'Message id: load newer messages' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 30, maximum: 50 } },
        ],
        responses: {
          200: {
            description: 'Messages oldest → newest',
            content: json(
              data({
                peer: { $ref: '#/components/schemas/User' },
                messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                hasMore: { type: 'boolean' },
              }),
            ),
          },
          404: error('User not found'),
        },
      },
    },
    '/api/messages/send/{id}': {
      post: {
        tags: ['Messages'],
        summary: 'Send a message (saved first, then pushed over Socket.IO)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Receiver id' }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['clientMessageId'],
            properties: {
              text: { type: 'string', maxLength: 2000 },
              clientMessageId: { type: 'string', format: 'uuid', description: 'Makes retries idempotent' },
              attachment: {
                type: 'object',
                properties: { dataUri: { type: 'string' }, name: { type: 'string' } },
              },
            },
          }),
        },
        responses: {
          201: { description: 'Created', content: json(data({ message: { $ref: '#/components/schemas/Message' } })) },
          200: { description: 'Retry of an already-saved message', content: json(data({ message: { $ref: '#/components/schemas/Message' } })) },
          400: error('Validation failed'),
          404: error('Receiver not found'),
        },
      },
    },
  },
};
