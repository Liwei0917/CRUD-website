import User, { ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

function buildAuthResponse(user) {
  const token = signToken({ sub: user._id.toString(), role: user.role });
  return { token, user: user.toJSON() };
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(409, 'An account with that email already exists.');
  }

  // Public registration always creates a regular user; roles are assigned by admins.
  const user = await User.create({ name, email, password, role: ROLES.USER });

  res.status(201).json({ success: true, ...buildAuthResponse(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false, so request it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  res.json({ success: true, ...buildAuthResponse(user) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

// PATCH /api/auth/me — update own name/email/password
export const updateMe = asyncHandler(async (req, res) => {
  const { name, email, password, currentPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.exists({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (taken) throw new ApiError(409, 'That email is already in use.');
    user.email = email;
  }

  if (name) user.name = name;

  if (password) {
    const ok = currentPassword && (await user.comparePassword(currentPassword));
    if (!ok) throw new ApiError(400, 'Current password is incorrect.');
    user.password = password;
  }

  await user.save();
  res.json({ success: true, user: user.toJSON() });
});
