import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  strategy: { type: String, enum: ['sip', 'fno', 'mixed'], required: true },
  initialInvestment: { type: Number, required: true },
  monthlyInvestment: { type: Number, default: 0 },
  durationYears: { type: Number, required: true },
  leverage: { type: Number, default: 1 },
  probabilityOfLoss: Number,
  probabilityOfProfit: Number,
  medianOutcome: Number,
  percentile5: Number,
  percentile95: Number,
  maxDrawdown: Number,
  totalInvested: Number,
  source: String,
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model('Simulation', simulationSchema);
