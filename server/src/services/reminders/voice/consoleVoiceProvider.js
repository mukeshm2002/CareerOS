const crypto = require('crypto');
const VoiceProvider = require('./voiceProvider.interface');

/**
 * Console/Mock Voice Provider for Local Development & Testing
 * Simulates real telephony without requiring active carrier contracts.
 */
class ConsoleVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.name = 'console';
    this.calls = new Map();
  }

  async makeCall({ to, message, reminderId, callbackUrl }) {
    const providerCallId = `sim_call_${crypto.randomUUID().slice(0, 8)}`;

    console.log(`\n============================================================`);
    console.log(`📞 [VOICE REMINDER DISPATCHED (CONSOLE PROVIDER)]`);
    console.log(`   To Phone:     ${to}`);
    console.log(`   Reminder ID:  ${reminderId}`);
    console.log(`   Provider ID:  ${providerCallId}`);
    console.log(`   TTS Message:  "${message}"`);
    console.log(`   Callback URL: ${callbackUrl || 'None'}`);
    console.log(`============================================================\n`);

    const callRecord = {
      providerCallId,
      to,
      message,
      reminderId,
      status: 'ANSWERED',
      createdAt: new Date(),
    };

    this.calls.set(providerCallId, callRecord);

    return {
      providerCallId,
      status: 'ANSWERED',
      simulated: true,
    };
  }

  async getCallStatus(providerCallId) {
    const call = this.calls.get(providerCallId);
    if (!call) {
      return { status: 'UNKNOWN' };
    }
    return {
      status: call.status,
      duration: 18,
    };
  }

  async handleWebhook(body, headers) {
    const providerCallId = body.CallSid || body.providerCallId || 'sim_unknown';
    const rawStatus = (body.CallStatus || body.status || 'completed').toLowerCase();

    let status = 'ANSWERED';
    let answered = true;

    if (rawStatus === 'no-answer' || rawStatus === 'busy') {
      status = 'MISSED';
      answered = false;
    } else if (rawStatus === 'failed' || rawStatus === 'canceled') {
      status = 'FAILED';
      answered = false;
    }

    return {
      providerCallId,
      reminderId: body.reminderId || null,
      status,
      answered,
      duration: body.CallDuration ? parseInt(body.CallDuration, 10) : 15,
    };
  }
}

module.exports = new ConsoleVoiceProvider();
