/**
 * Base Voice Provider Interface
 * All telephony adapters (Console, Twilio, etc.) must implement this interface.
 */
class VoiceProvider {
  /**
   * Initiate outbound phone call
   * @param {Object} params
   * @param {string} params.to - E.164 phone number
   * @param {string} params.message - Text-to-speech message
   * @param {string} params.reminderId - Reminder ID
   * @param {string} params.callbackUrl - Webhook URL for status updates
   * @returns {Promise<{ providerCallId: string, status: string }>}
   */
  async makeCall(params) {
    throw new Error('makeCall must be implemented by subclass');
  }

  /**
   * Query status of an ongoing or completed call
   * @param {string} providerCallId
   * @returns {Promise<{ status: string, duration?: number }>}
   */
  async getCallStatus(providerCallId) {
    throw new Error('getCallStatus must be implemented by subclass');
  }

  /**
   * Validate and parse status callback from telephony webhook
   * @param {Object} body
   * @param {Object} headers
   * @returns {Promise<{ providerCallId: string, reminderId?: string, status: string, answered: boolean, duration?: number }>}
   */
  async handleWebhook(body, headers) {
    throw new Error('handleWebhook must be implemented by subclass');
  }
}

module.exports = VoiceProvider;
