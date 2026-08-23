import crypto from 'node:crypto';

const users = new Map();
const simulations = [];

export function isDemoMode() { return !process.env.MONGO_URI; }
export function demoFindUserByEmail(email) { return [...users.values()].find(u => u.email === email); }
export function demoFindUserById(id) { return users.get(id); }
export function demoCreateUser(data) { const user = { _id: crypto.randomUUID(), ...data, createdAt: new Date() }; users.set(user._id, user); return user; }
export function demoCreateSimulation(data) { const item = { _id: crypto.randomUUID(), ...data, createdAt: new Date() }; simulations.unshift(item); return item; }
export function demoFindSimulationsByUser(userId) { return simulations.filter(s => String(s.userId) === String(userId)).slice(0,20); }
