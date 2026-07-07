import User, { ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORTABLE_FIELDS = new Set(['name', 'email', 'role', 'createdAt', 'updatedAt']);
const MAX_LIMIT = 100;

/**
 * GET /api/users
 * Admin-only paginated + searchable listing.
 *
 * Query params: page, limit, search, role, sort (e.g. "-createdAt"), active
 *
 * Scaling notes for large collections (up to 500k+):
 *  - Search uses a case-insensitive prefix regex anchored with `^`, which can
 *    use the {name,email} indexes; unanchored substrings on huge collections
 *    would force a collection scan.
 *  - `countDocuments` on the same filter is used for total pages. On very large
 *    collections you may instead cache counts or use estimatedDocumentCount when
 *    no filter is applied (done below for the unfiltered case).
 *  - `.lean()` skips Mongoose hydration for a faster, lighter response.
 */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.role && Object.values(ROLES).includes(req.query.role)) {
    filter.role = req.query.role;
  }

  if (req.query.active === 'true' || req.query.active === 'false') {
    filter.isActive = req.query.active === 'true';
  }

  const search = (req.query.search || '').trim();
  if (search) {
    // Escape regex special chars, anchor to start so an index can be used.
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`^${safe}`, 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    const raw = String(req.query.sort);
    const dir = raw.startsWith('-') ? -1 : 1;
    const field = raw.replace(/^-/, '');
    if (SORTABLE_FIELDS.has(field)) sort = { [field]: dir };
  }

  const isUnfiltered = Object.keys(filter).length === 0;

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    isUnfiltered ? User.estimatedDocumentCount() : User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: skip + items.length < total,
      hasPrevPage: page > 1,
    },
  });
});

// GET /api/users/stats — small dashboard summary
export const getUserStats = asyncHandler(async (_req, res) => {
  const [total, admins, active] = await Promise.all([
    User.estimatedDocumentCount(),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ isActive: true }),
  ]);
  res.json({
    success: true,
    stats: { total, admins, users: total - admins, active, inactive: total - active },
  });
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, user: user.toJSON() });
});

// POST /api/users — admin creates a user (can set role)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, isActive } = req.body;

  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with that email already exists.');

  const user = await User.create({
    name,
    email,
    password,
    role: Object.values(ROLES).includes(role) ? role : ROLES.USER,
    isActive: typeof isActive === 'boolean' ? isActive : true,
  });

  res.status(201).json({ success: true, user: user.toJSON() });
});

// PATCH /api/users/:id — admin updates a user
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found.');

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.exists({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (taken) throw new ApiError(409, 'That email is already in use.');
    user.email = email;
  }

  if (name) user.name = name;
  if (role && Object.values(ROLES).includes(role)) {
    // Guard against an admin removing the last remaining admin's role.
    if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
      if (adminCount <= 1) throw new ApiError(400, 'Cannot demote the last remaining admin.');
    }
    user.role = role;
  }
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (password) user.password = password; // re-hashed by pre-save hook

  await user.save();
  res.json({ success: true, user: user.toJSON() });
});

// DELETE /api/users/:id — admin deletes a user
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) throw new ApiError(400, 'Cannot delete the last remaining admin.');
  }

  await user.deleteOne();
  res.json({ success: true, message: 'User deleted.' });
});
