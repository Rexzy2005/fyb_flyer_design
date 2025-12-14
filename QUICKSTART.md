# Quick Start Guide

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Create an Account**
   - Click "Sign Up" in the header
   - Fill in your details (email, username, password)
   - Optional: Select your department

2. **Browse Templates**
   - Go to "Templates" page
   - Filter by category (FYB or Sign-out)
   - Click on any template to start editing

3. **Edit Template**
   - Fill in the form fields on the right
   - Upload your photo
   - See live preview on the left
   - Note: Preview has watermarks

4. **Download Design**
   - Click "Download" button
   - First download requires payment (simulated)
   - Complete the mock payment flow
   - High-quality image downloads automatically
   - Email confirmation is simulated

5. **View Dashboard**
   - Access your download history
   - View profile information
   - Re-download previous designs

## Test Accounts

You can create any account - all authentication is simulated and stored in localStorage.

## Department Access Codes

Some templates are locked. Test access codes:
- **Computer Science**: `CS2024`
- **Electrical Engineering**: `EE2024`

## Payment Simulation

- Payment success rate: ~80% (randomized)
- Amount: ₦500 per download
- First download always requires payment
- One free edit allowed after first download

## Notes

- All data is stored in browser localStorage
- Refresh will persist authentication
- Clear browser data to reset everything
- This is a frontend-only simulation

