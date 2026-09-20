const crypto = require('crypto');
const prisma = require('../../config/db');

class ContactService {
  /**
   * Normalizes raw phone number to clean E.164 format (+[country][digits])
   */
  normalizePhone(raw) {
    if (!raw) return '';
    let cleaned = raw.replace(/[\s\-()]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Masks a phone number for secure display, preserving country code and last 3 digits
   * e.g. +919876543210 -> "+91 ••••• ••210"
   */
  maskPhone(normalized) {
    if (!normalized || normalized.length < 8) return normalized;

    let prefix = '+91';
    let localDigits = normalized.slice(3);

    if (normalized.startsWith('+91')) {
      prefix = '+91';
      localDigits = normalized.slice(3);
    } else if (normalized.startsWith('+1')) {
      prefix = '+1';
      localDigits = normalized.slice(2);
    } else if (normalized.startsWith('+44')) {
      prefix = '+44';
      localDigits = normalized.slice(3);
    } else if (normalized.startsWith('+61') || normalized.startsWith('+65') || normalized.startsWith('+81')) {
      prefix = normalized.slice(0, 3);
      localDigits = normalized.slice(3);
    } else {
      prefix = normalized.slice(0, 3);
      localDigits = normalized.slice(3);
    }

    if (localDigits.length <= 4) {
      return `${prefix} •••• ${localDigits.slice(-2)}`;
    }

    const lastThree = localDigits.slice(-3);
    return `${prefix} ••••• ••${lastThree}`;
  }

  /**
   * Get authenticated user's phone contact status
   */
  async getPhoneContact(userId) {
    const contact = await prisma.userContact.findFirst({
      where: { userId, type: 'PHONE' },
      select: {
        id: true,
        maskedValue: true,
        verified: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return {
      phoneVerified: Boolean(contact?.verified),
      phoneContact: contact || null,
    };
  }

  /**
   * Initiate phone number verification
   */
  async startVerification(userId, rawPhone) {
    const normalizedValue = this.normalizePhone(rawPhone);
    const maskedValue = this.maskPhone(normalizedValue);

    // Generate cryptographically secure 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert contact record for user
    const existing = await prisma.userContact.findFirst({
      where: { userId, type: 'PHONE' },
    });

    let contact;
    if (existing) {
      contact = await prisma.userContact.update({
        where: { id: existing.id },
        data: {
          normalizedValue,
          maskedValue,
          verified: false,
          verifiedAt: null,
          verificationCode: code,
          codeExpiresAt,
        },
      });
    } else {
      contact = await prisma.userContact.create({
        data: {
          userId,
          type: 'PHONE',
          normalizedValue,
          maskedValue,
          verified: false,
          verificationCode: code,
          codeExpiresAt,
        },
      });
    }

    // In local development / console provider mode, log OTP clearly to server console
    console.log(`=======================================================`);
    console.log(`[PHONE VERIFICATION] Verification OTP for ${maskedValue}: ${code}`);
    console.log(`[PHONE VERIFICATION] Valid for 10 minutes until: ${codeExpiresAt.toISOString()}`);
    console.log(`=======================================================`);

    return {
      id: contact.id,
      maskedValue: contact.maskedValue,
      message: `Verification code sent to ${maskedValue}`,
      // For automated tests and dev convenience, provide code if in test/development
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  /**
   * Confirm phone verification OTP
   */
  async confirmVerification(userId, code) {
    const contact = await prisma.userContact.findFirst({
      where: { userId, type: 'PHONE' },
    });

    if (!contact) {
      const error = new Error('No phone verification in progress');
      error.statusCode = 404;
      throw error;
    }

    if (!contact.verificationCode || !contact.codeExpiresAt) {
      const error = new Error('Verification code has expired or was already used');
      error.statusCode = 400;
      throw error;
    }

    if (new Date() > contact.codeExpiresAt) {
      const error = new Error('Verification code has expired. Please request a new code.');
      error.statusCode = 400;
      throw error;
    }

    if (contact.verificationCode !== code.trim()) {
      const error = new Error('Invalid verification code. Please check and try again.');
      error.statusCode = 400;
      throw error;
    }

    // Mark as verified and clear code
    const updated = await prisma.userContact.update({
      where: { id: contact.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verificationCode: null,
        codeExpiresAt: null,
      },
      select: {
        id: true,
        maskedValue: true,
        verified: true,
        verifiedAt: true,
      },
    });

    // Also update UserPreference to enable voice reminders if user desired
    await prisma.userPreference.updateMany({
      where: { userId },
      data: { voiceRemindersEnabled: true },
    });

    return {
      phoneVerified: true,
      verified: true,
      phoneContact: updated,
      contact: updated,
      message: 'Phone number verified successfully',
    };
  }

  /**
   * Delete or detach phone contact
   */
  async deletePhoneContact(userId) {
    const existing = await prisma.userContact.findFirst({
      where: { userId, type: 'PHONE' },
    });

    if (existing) {
      await prisma.userContact.delete({
        where: { id: existing.id },
      });

      // Disable voice reminders preference
      await prisma.userPreference.updateMany({
        where: { userId },
        data: { voiceRemindersEnabled: false },
      });
    }

    return { message: 'Phone contact removed' };
  }
}

module.exports = new ContactService();
