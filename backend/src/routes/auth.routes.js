import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema, updateProfileSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/signup', signupLimiter, validate({ body: signupSchema }), auth.signup);
router.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);
router.post('/logout', auth.logout);
router.get('/check', protectRoute, auth.check);
router.get('/socket-token', protectRoute, auth.socketToken);
router.put('/update-profile', protectRoute, validate({ body: updateProfileSchema }), auth.updateProfile);

export default router;
