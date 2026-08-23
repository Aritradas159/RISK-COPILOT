import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  preferredLanguage: { type: String, enum: ['en', 'ta'], default: 'en' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model('User', userSchema);
