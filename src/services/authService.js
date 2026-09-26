import { storageRepository } from './storageRepository.js';

export const authService = {
  login(email, password) {
    const user = storageRepository.getUser();
    if (user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password) {
      return { success: true, user };
    }
    // Also allow demo quick-login credentials
    if (email === 'admin@stocksense.local' && password === 'admin123') {
      return { success: true, user };
    }
    throw new Error('Invalid email or password. Please check your credentials.');
  },

  signup({ name, email, password }) {
    if (!name || !email || !password) {
      throw new Error('All registration fields are required.');
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'Inventory Specialist',
      department: 'Warehouse Operations',
      assignedWarehouse: 'WH-01',
      avatarInitials: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US',
    };
    storageRepository.saveUser(newUser);
    return { success: true, user: newUser };
  },

  requestOTP(email) {
    const user = storageRepository.getUser();
    if (user.email.toLowerCase() !== email.trim().toLowerCase() && email !== 'admin@stocksense.local') {
      throw new Error('No registered account found with that email address.');
    }
    // Deterministic or simulated 6-digit OTP
    const otp = '849201';
    return { success: true, otp };
  },

  verifyAndResetPassword(email, otp, newPassword) {
    if (otp !== '849201' && otp !== '123456') {
      throw new Error('Invalid verification code. Please check and try again.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const user = storageRepository.getUser();
    const updated = { ...user, password: newPassword };
    storageRepository.saveUser(updated);
    return { success: true };
  },

  updateProfile(profileData) {
    const user = storageRepository.getUser();
    const updated = { ...user, ...profileData };
    storageRepository.saveUser(updated);
    return updated;
  },
};
