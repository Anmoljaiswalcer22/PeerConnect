import { Router } from 'express';
import * as messages from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { historyQuerySchema, sendMessageSchema } from '../validators/message.schema.js';

const router = Router();

router.use(protectRoute);

// '/users' must come before '/:id'
router.get('/users', messages.getUsers);
router.get('/:id', validate({ params: idParams, query: historyQuerySchema }), messages.getMessages);
router.post('/send/:id', validate({ params: idParams, body: sendMessageSchema }), messages.sendMessage);

export default router;
