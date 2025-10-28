import crypto from 'crypto';

/**
 * Validate Alchemy webhook signature using HMAC-SHA256
 *
 * @param signature - Signature from 'x-alchemy-signature' header
 * @param body - Raw request body as string
 * @param secret - Alchemy webhook secret (from environment)
 * @returns true if signature is valid, false otherwise
 */
export function validateAlchemySignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Compute HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating Alchemy signature:', error);
    return false;
  }
}

/**
 * Extract signature from Alchemy webhook headers
 */
export function extractAlchemySignature(headers: Headers): string | null {
  return headers.get('x-alchemy-signature');
}

/**
 * Validate webhook request body format
 * Basic checks before signature validation
 */
export function validateWebhookBody(body: any): { isValid: boolean; error?: string } {
  if (!body) {
    return { isValid: false, error: 'Empty webhook body' };
  }

  if (typeof body !== 'object') {
    return { isValid: false, error: 'Invalid webhook body format' };
  }

  // Alchemy webhooks typically have an 'event' field
  if (!body.event) {
    return { isValid: false, error: 'Missing event field' };
  }

  return { isValid: true };
}

