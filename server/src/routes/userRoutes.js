import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createUser,
  deleteUser,
  getUser,
  getUserStats,
  listUsers,
  updateUser,
} from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../models/User.js';

const router = Router();

// Every route below requires an authenticated admin.
router.use(protect, authorize(ROLES.ADMIN));

const idRule = param('id').isMongoId().withMessage('Invalid user id');

router.get('/', listUsers);
router.get('/stats', getUserStats);
router.get('/:id', idRule, validate, getUser);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[a-zA-Z]/)
      .matches(/\d/),
    body('role').optional().isIn(Object.values(ROLES)),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  createUser
);

router.patch(
  '/:id',
  [
    idRule,
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }).matches(/[a-zA-Z]/).matches(/\d/),
    body('role').optional().isIn(Object.values(ROLES)),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateUser
);

router.delete('/:id', idRule, validate, deleteUser);

export default router;
