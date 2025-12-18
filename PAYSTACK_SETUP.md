# Payment System - Paystack Integration Complete

## Summary
All simulated/mock payments have been removed. The project now uses **Paystack Test Payment** exclusively.

## Configuration
- **Secret Key**: `PAYSTACK_SECRET_KEY` (in .env)
- **Public Key**: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (in .env)
- **Environment**: Test Mode (use test cards)

## Payment Flow
1. User initiates download → Payment required
2. API calls `POST /api/payments/initiate`
3. Paystack API initializes transaction
4. User redirected to Paystack checkout
5. After payment, API calls `POST /api/payments/verify`
6. Paystack verifies transaction and updates status

## Test Card Details
- **Card Number**: `4084084084084081`
- **Expiry**: Any future date (MM/YY format)
- **CVV**: Any 3 digits
- **OTP**: 123456 (when prompted)

## Download Rules (Per Template)
- **1st Download**: PAID ✅ (creates download record)
- **2nd Download**: FREE ✅ (one free download per template)
- **3rd+ Downloads**: PAID ✅ (requires payment again)

Each template has its own independent download cycle. When users switch templates, they start fresh with that template's payment cycle.

## Files Using Paystack
- ✅ [lib/payment.ts](lib/payment.ts) - Paystack API integration
- ✅ [services/payment.service.ts](services/payment.service.ts) - Payment logic
- ✅ [app/api/payments/initiate/route.ts](app/api/payments/initiate/route.ts) - Initiate endpoint
- ✅ [app/api/payments/verify/route.ts](app/api/payments/verify/route.ts) - Verify endpoint

## Environment Variables Required
```
PAYSTACK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

All payments are now real Paystack transactions using test credentials!
