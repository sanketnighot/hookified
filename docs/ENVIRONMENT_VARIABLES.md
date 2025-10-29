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

### Alchemy Custom Webhooks (for ONCHAIN triggers)
```bash
ALCHEMY_API_KEY="your-alchemy-api-key"  # Required
ALCHEMY_AUTH_TOKEN="your-alchemy-auth-token"  # Required for Dashboard API
ALCHEMY_APP_ID="your-alchemy-app-id"  # Optional, may be required for webhook creation
ALCHEMY_BASE_URL="https://eth-mainnet.g.alchemy.com"  # Optional, defaults to mainnet
ALCHEMY_DASHBOARD_API_URL="https://dashboard.alchemy.com/api"  # Optional, defaults to Alchemy Dashboard API
ALCHEMY_WEBHOOK_SECRET="your-alchemy-webhook-secret"  # Required for webhook signature verification
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

### Block Explorer APIs (for ABI fetching)
```bash
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

**Note**: A single Etherscan API key works for all Etherscan-compatible block explorers including:
- Etherscan (Ethereum Mainnet & Sepolia)
- BSCScan (BSC Mainnet & Testnet)
- Polygonscan (Polygon Mainnet & Amoy)
- Basescan (Base Mainnet & Sepolia)

### Webhook Security
```bash
WEBHOOK_SECRET="your-default-webhook-secret"
```

### Cron Job Security
```bash
CRON_SECRET="your-cron-job-secret"
```

## Environment Variable Details

### ALCHEMY_API_KEY
- **Purpose**: API key for Alchemy services
- **Required for**: ONCHAIN trigger type hooks
- **How to get**: Sign up at [Alchemy](https://www.alchemy.com/) and create an API key
- **Format**: String (e.g., "alcht_1234567890abcdef")

### ALCHEMY_AUTH_TOKEN
- **Purpose**: Authentication token for Alchemy Dashboard API to create/manage webhooks
- **Required for**: ONCHAIN trigger type hooks (webhook creation and deletion)
- **How to get**:
  1. Sign in to your Alchemy Dashboard at https://dashboard.alchemy.com
  2. Navigate to the Webhooks section
  3. Look for the "Auth Token" in the top right of the page
  4. Copy this token to use with the Notify API
- **Format**: String token for X-Alchemy-Token header
- **Note**: This is different from your API key - it's specifically for webhook management

### ALCHEMY_APP_ID
- **Purpose**: Application ID for Alchemy webhook management (may be required)
- **Required for**: ONCHAIN trigger type hooks (webhook creation, if required by Alchemy)
- **How to get**: Available in your Alchemy Dashboard
- **Format**: String identifier

### ALCHEMY_WEBHOOK_SECRET
- **Purpose**: Secret key for verifying webhook signatures from Alchemy
- **Required for**: Webhook signature verification (recommended for production)
- **How to get**: Configure in your Alchemy webhook settings
- **Format**: String secret key
- **Security**: Keep this secret secure and never commit to version control

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

### CRON_SECRET
- **Purpose**: Secret for securing cron job execution endpoints
- **Required for**: CRON trigger type hooks
- **Security**: Used to authenticate requests from Supabase Edge Functions
- **Format**: String (any secure random string)

### ETHERSCAN_API_KEY
- **Purpose**: API key for Etherscan-compatible block explorers to fetch contract ABIs and metadata
- **Required for**: CONTRACT_CALL action type hooks on all supported networks
- **How to get**: Sign up at [Etherscan](https://etherscan.io/) and create an API key
- **Format**: String (e.g., "YourApiKeyToken")
- **Compatibility**: Works with Etherscan, BSCScan, Polygonscan, and Basescan APIs

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
