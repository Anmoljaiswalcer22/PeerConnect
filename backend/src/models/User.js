import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // bcrypt hash; never returned by queries unless explicitly selected with +password
    password: { type: String, required: true, select: false },
    profilePic: { type: String, default: '' },
    profilePicId: { type: String, default: '', select: false },
    lastSeen: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.profilePicId;
        return ret;
      },
    },
  },
);

userSchema.index({ fullName: 1 });

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);

/** The fields other users are allowed to see. */
export const PUBLIC_USER_FIELDS = 'fullName profilePic lastSeen createdAt';

export const toPublicUser = (user) => ({
  _id: String(user._id),
  fullName: user.fullName,
  profilePic: user.profilePic ?? '',
  lastSeen: user.lastSeen ?? null,
  createdAt: user.createdAt,
});
