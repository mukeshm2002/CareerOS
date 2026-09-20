const contactService = require('../services/contacts/contact.service');
const { startPhoneVerificationSchema, confirmPhoneVerificationSchema } = require('../schemas/contact.schema');
const { sendSuccess } = require('../utils/response');

class ContactController {
  async getPhoneContact(req, res, next) {
    try {
      const data = await contactService.getPhoneContact(req.user.id);
      return sendSuccess(res, data, 'Phone contact retrieved');
    } catch (error) {
      next(error);
    }
  }

  async startVerification(req, res, next) {
    try {
      const { phone } = startPhoneVerificationSchema.parse(req.body);
      const data = await contactService.startVerification(req.user.id, phone);
      return sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  async confirmVerification(req, res, next) {
    try {
      const { code } = confirmPhoneVerificationSchema.parse(req.body);
      const data = await contactService.confirmVerification(req.user.id, code);
      return sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  async deletePhoneContact(req, res, next) {
    try {
      const data = await contactService.deletePhoneContact(req.user.id);
      return sendSuccess(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContactController();
