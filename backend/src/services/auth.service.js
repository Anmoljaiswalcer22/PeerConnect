import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User, toPublicUser } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteAsset, uploadDataUri } from '../config/cloudinary.js';
import { IMAGE_MIME_TYPES, MAX_AVATAR_BYTES, inspectDataUri } from '../utils/dataUri.js';
import { emitToAll } from '../socket/emitter.js';
import { EVENTS } from '../socket/events.js';

// 12 rounds ≈ 250 ms per hash: slow for attackers, fine for users. Tests use 4 for speed.
const SALT_ROUNDS = env.isTest ? 4 : 12;

// Compared against when the email doesn't exist, so a failed login takes the
// same time either way and doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('peerconnect-timing-equaliser', SALT_ROUNDS);

export async function signup({ fullName, email, password }) {
  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  // The unique index still catches a race between two simultaneous sign-ups (→ 409).
  const user = await User.create({ fullName, email, password: hash });

  emitToAll(EVENTS.USER_JOINED, toPublicUser(user));
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !valid) throw ApiError.unauthorized('Invalid email or password');

  user.password = undefined;
  return user;
}

export async function updateProfile(userId, { fullName, profilePic }) {
  const user = await User.findById(userId).select('+profilePicId');
  if (!user) throw ApiError.notFound('User not found');

  let oldPicId;
  if (profilePic) {
    inspectDataUri(profilePic, { allowed: IMAGE_MIME_TYPES, maxBytes: MAX_AVATAR_BYTES });
    const uploaded = await uploadDataUri(profilePic, { folder: 'avatars', resourceType: 'image' });
    oldPicId = user.profilePicId;
    user.profilePic = uploaded.url;
    user.profilePicId = uploaded.publicId;
  }
  if (fullName) user.fullName = fullName;

  await user.save();
  if (oldPicId) await deleteAsset(oldPicId, 'image');

  emitToAll(EVENTS.USER_UPDATED, toPublicUser(user));
  return user;
}
