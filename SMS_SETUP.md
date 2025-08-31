# SMS Setup Guide for ZawadiTap

## Overview
Since Twilio doesn't support phone numbers in Nigeria, we've implemented a multi-provider SMS system with fallbacks.

## SMS Providers (Priority Order)

### 1. Africa's Talking (Primary - Best for Nigeria)
- **Coverage**: Excellent coverage across Africa including Nigeria
- **Pricing**: Competitive rates for African markets
- **Setup**: Easy integration

#### Setup Steps:
1. **Sign up** at [Africa's Talking](https://africastalking.com/)
2. **Get credentials**:
   - Username (usually your app name)
   - API Key
3. **Add to .env**:
   ```bash
   AFRICAS_TALKING_USERNAME=your_username
   AFRICAS_TALKING_API_KEY=your_api_key
   ```

### 2. Twilio (Fallback - Global coverage)
- **Coverage**: Global coverage (but no Nigerian numbers)
- **Pricing**: Higher rates for international SMS
- **Setup**: Good for testing with US/UK numbers

#### Setup Steps:
1. **Sign up** at [Twilio](https://twilio.com/)
2. **Get credentials**:
   - Account SID
   - Auth Token
   - Phone number (US/UK recommended)
3. **Add to .env**:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
   ```

### 3. Console Fallback (Development)
- **Coverage**: Local development only
- **Pricing**: Free
- **Setup**: Automatic when no SMS providers configured

## Environment Variables

```bash
# .env file
# Africa's Talking (Primary for Nigeria)
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_api_key

# Twilio (Fallback)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Other required variables
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/zawaditap
```

## How It Works

1. **Primary**: Africa's Talking handles Nigerian numbers
2. **Fallback**: Twilio handles other countries
3. **Development**: Console logging when SMS fails

## Testing

### Test Africa's Talking:
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2348105951215", "deviceId": "test-device"}'
```

### Test Twilio Fallback:
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "deviceId": "test-device"}'
```

## Troubleshooting

### Africa's Talking Issues:
- **Invalid credentials**: Check username and API key
- **Rate limits**: Check your account balance
- **Number format**: Ensure phone numbers include country code

### Twilio Issues:
- **Country restrictions**: Some countries don't support SMS
- **Invalid from number**: Must be a valid Twilio number
- **Account status**: Check if account is suspended

### Console Fallback:
- **Check server logs** for OTP codes
- **Look for messages** like: `OTP for +2348105951215: 123456`

## Cost Comparison

| Provider | Nigeria SMS | US SMS | Setup Cost |
|----------|-------------|---------|-------------|
| Africa's Talking | ~$0.02-0.05 | ~$0.05-0.10 | Free |
| Twilio | Not available | ~$0.0075 | Free |
| Console | Free | Free | Free |

## Recommendations

1. **For Production in Nigeria**: Use Africa's Talking
2. **For Global Coverage**: Use both providers
3. **For Development**: Use console fallback
4. **For Testing**: Use Africa's Talking with test credits

## Next Steps

1. **Sign up for Africa's Talking**
2. **Get your credentials**
3. **Update your .env file**
4. **Test with a Nigerian number**
5. **Monitor SMS delivery**

## Support

- **Africa's Talking**: [Support Portal](https://support.africastalking.com/)
- **Twilio**: [Support Center](https://support.twilio.com/)
- **Project Issues**: Check the project repository
