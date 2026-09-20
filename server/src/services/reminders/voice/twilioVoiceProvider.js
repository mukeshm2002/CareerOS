const https = require('https');
const crypto = require('crypto');
const VoiceProvider = require('./voiceProvider.interface');

/**
 * Production Twilio Voice Provider Adapter
 * Communicates with Twilio REST API using environment variables.
 * Never logs credentials.
 */
class TwilioVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.name = 'twilio';
  }

  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  /**
   * Generates secure TwiML for text-to-speech reminder
   */
  generateTwiml(message) {
    // Clean string to prevent XML injection
    const escapedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `<Response><Pause length="1"/><Say voice="alice" language="en-IN">${escapedMessage}</Say><Pause length="1"/><Say voice="alice" language="en-IN">Goodbye.</Say><Hangup/></Response>`;
  }

  async makeCall({ to, message, reminderId, callbackUrl }) {
    if (!this.isConfigured()) {
      throw new Error('Twilio Voice is not configured. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.');
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const twiml = this.generateTwiml(message);

    const postData = new URLSearchParams({
      To: to,
      From: fromNumber,
      Twiml: twiml,
    });

    if (callbackUrl) {
      postData.append('StatusCallback', callbackUrl);
      postData.append('StatusCallbackEvent', 'completed');
      postData.append('StatusCallbackMethod', 'POST');
    }

    return new Promise((resolve, reject) => {
      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${accountSid}/Calls.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData.toString()),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                providerCallId: parsed.sid,
                status: parsed.status,
              });
            } else {
              reject(new Error(`Twilio Voice error: ${parsed.message || 'Call placement failed'}`));
            }
          } catch (err) {
            reject(new Error(`Twilio response parse error: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Twilio network request failed: ${err.message}`));
      });

      req.write(postData.toString());
      req.end();
    });
  }

  async getCallStatus(providerCallId) {
    if (!this.isConfigured()) {
      return { status: 'UNKNOWN' };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    return new Promise((resolve, reject) => {
      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              status: parsed.status,
              duration: parsed.duration ? parseInt(parsed.duration, 10) : 0,
            });
          } catch (err) {
            resolve({ status: 'UNKNOWN' });
          }
        });
      });

      req.on('error', () => resolve({ status: 'UNKNOWN' }));
      req.end();
    });
  }

  async handleWebhook(body, headers) {
    const providerCallId = body.CallSid || '';
    const rawStatus = (body.CallStatus || '').toLowerCase();

    let status = 'ANSWERED';
    let answered = true;

    if (rawStatus === 'completed' || rawStatus === 'in-progress') {
      status = 'ANSWERED';
      answered = true;
    } else if (rawStatus === 'busy' || rawStatus === 'no-answer') {
      status = 'MISSED';
      answered = false;
    } else if (rawStatus === 'failed' || rawStatus === 'canceled') {
      status = 'FAILED';
      answered = false;
    }

    return {
      providerCallId,
      status,
      answered,
      duration: body.CallDuration ? parseInt(body.CallDuration, 10) : 0,
    };
  }
}

module.exports = new TwilioVoiceProvider();
