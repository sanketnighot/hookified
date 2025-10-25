# Environment Variables Configuration

This document outlines all the environment variables required for the Hookified application to function properly.

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/hookified"
```

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## External Service APIs

### Alchemy Notify (for ONCHAIN triggers)
```bash
ALCHEMY_API_KEY="your-alchemy-api-key"
ALCHEMY_BASE_URL="https://eth-mainnet.g.alchemy.com"  # Optional, defaults to mainnet
ALCHEMY_WEBHOOK_SECRET="your-alchemy-webhook-secret"  # Optional, for webhook verification
```

### Telegram Bot (for TELEGRAM actions)
```bash
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
```

### Contract Calls (for CONTRACT_CALL actions)
```bash
ADMIN_WALLET_PRIVATE_KEY="your-private-key-for-contract-calls"
CONTRACT_RPC_URL="https://mainnet.infura.io/v3/your-project-id"
```

### Webhook Security
```bash
WEBHOOK_SECRET="your-default-webhook-secret"
```

## Environment Variable Details

### ALCHEMY_API_KEY
- **Purpose**: API key for Alchemy Notify service to monitor blockchain events
- **Required for**: ONCHAIN trigger type hooks
- **How to get**: Sign up at [Alchemy](https://www.alchemy.com/) and create an API key
- **Format**: String (e.g., "alcht_1234567890abcdef")

### TELEGRAM_BOT_TOKEN
- **Purpose**: Bot token for sending messages via Telegram Bot API
- **Required for**: TELEGRAM action type hooks
- **How to get**:
  1. Message @BotFather on Telegram
  2. Use `/newbot` command
  3. Follow instructions to create a bot
  4. Copy the bot token
- **Format**: String (e.g., "123456789:ABCdefGHIjklMNOpqrsTUVwxyz")

### ADMIN_WALLET_PRIVATE_KEY
- **Purpose**: Private key for signing blockchain transactions
- **Required for**: CONTRACT_CALL action type hooks
- **Security**: ⚠️ **CRITICAL**: Never commit this to version control
- **Format**: Hex string (e.g., "0x1234567890abcdef...")

### CONTRACT_RPC_URL
- **Purpose**: RPC endpoint for blockchain network access
- **Required for**: CONTRACT_CALL action type hooks
- **Providers**: Infura, Alchemy, QuickNode, or local node
- **Format**: URL (e.g., "https://mainnet.infura.io/v3/your-project-id")

### WEBHOOK_SECRET
- **Purpose**: Secret for validating incoming webhook requests
- **Required for**: WEBHOOK trigger type hooks (optional per-hook secret)
- **Security**: Used for HMAC signature verification
- **Format**: String (any secure random string)

## Configuration Management

The application uses a centralized configuration system located in `src/lib/config.ts` that:

1. **Validates** all environment variables on startup
2. **Provides** helper functions to access configuration
3. **Warns** about missing variables without crashing
4. **Centralizes** all configuration logic

### Usage Examples

```typescript
import { getTelegramConfig, isTelegramConfigured } from '@/lib/config';

// Check if Telegram is configured
if (isTelegramConfigured()) {
  const config = getTelegramConfig();
  // Use config.botToken
}

// Check if Alchemy is configured
import { isAlchemyConfigured, getAlchemyConfig } from '@/lib/config';
if (isAlchemyConfigured()) {
  const config = getAlchemyConfig();
  // Use config.apiKey and config.baseUrl
}
```

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use different** environment variables for development, staging, and production
3. **Rotate** API keys and secrets regularly
4. **Use strong** random strings for secrets
5. **Limit** API key permissions to minimum required
6. **Monitor** API usage and set up alerts for unusual activity

## Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values:
   ```bash
   # Edit .env.local with your actual values
   nano .env.local
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Production Deployment

For production deployments (Vercel, Railway, etc.):

1. **Set environment variables** in your hosting platform's dashboard
2. **Use strong secrets** for production
3. **Enable** webhook signature verification
4. **Monitor** API usage and costs
5. **Set up** proper logging and alerting

## Troubleshooting

### Common Issues

1. **"Telegram bot token not configured"**
   - Check `TELEGRAM_BOT_TOKEN` is set correctly
   - Verify the token is valid by testing with Bot API

2. **"Alchemy API key not configured"**
   - Check `ALCHEMY_API_KEY` is set correctly
   - Verify the key has proper permissions

3. **"Contract private key not configured"**
   - Check `ADMIN_WALLET_PRIVATE_KEY` is set correctly
   - Ensure the key has sufficient funds for gas

4. **Webhook signature validation fails**
   - Check `WEBHOOK_SECRET` matches between sender and receiver
   - Verify HMAC signature calculation

### Validation

The application will log warnings for missing environment variables but will not crash. Check the console output for configuration warnings.
