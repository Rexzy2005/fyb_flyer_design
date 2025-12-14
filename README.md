# FYB University - Flyer Design Platform

A production-ready Next.js web application for final year university students in Nigeria to create professional flyer designs.

## Features

- 🎨 **Professional Templates**: Choose from FYB Face of the Day/Week and Sign-out flyer templates
- 🖼️ **Live Preview**: Real-time canvas preview with dynamic form updates
- 💳 **Payment Integration**: Simulated Paystack payment flow for downloads
- 📧 **Email Delivery**: Automatic email delivery simulation after download
- 🔒 **Department Lock System**: Secure access codes for department-specific templates
- 👤 **User Dashboard**: Track downloads, view history, and manage profile
- 🎭 **Dark/Light Mode**: Beautiful theme switching
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🔐 **Authentication**: Complete signup/login system with session persistence

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: Fabric.js
- **State Management**: Zustand
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fyb_flyer_design
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── templates/         # Template listing
│   ├── editor/            # Template editor with canvas
│   ├── dashboard/         # User dashboard
│   └── admin/             # Admin panel
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components
│   ├── canvas/            # Canvas-related components
│   └── payment/           # Payment components
├── lib/                   # Utility functions and types
├── store/                 # Zustand state management
└── styles/                # Global styles
```

## Key Features Explained

### Template System
- Templates are categorized as FYB or Sign-out
- Each template has configurable fields (text, images, dates)
- Templates can be locked to specific departments
- Usage tracking for analytics

### Payment & Download Logic
- First download requires payment
- One free edit allowed after first download
- Subsequent edits require payment
- High-quality export (no watermarks) after payment
- Preview mode has watermarks and restrictions

### Department Lock System
- Some templates require department access codes
- Codes have expiration dates and usage limits
- Invalid codes are rejected with clear error messages

### Preview Restrictions
- Low resolution preview
- Heavy watermark overlay
- Username and email watermarks
- Disabled right-click and text selection
- "PREVIEW ONLY" badge

## Simulated Backend Features

This is a **frontend-only** application with simulated backend behavior:

- **Authentication**: User data stored in localStorage
- **Payments**: Mock Paystack flow (80% success rate)
- **Email Delivery**: Simulated email sending confirmation
- **Template Management**: In-memory template storage
- **Download Tracking**: localStorage-based download history

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Currently, no environment variables are required as this is a frontend-only simulation. For production backend integration, you would need:

- Database connection strings
- Payment gateway API keys
- Email service credentials
- Authentication service keys

## Contributing

This is a production-ready MVP designed for easy backend integration. All simulated backend logic is clearly marked and can be replaced with actual API calls.

## License

Private project for FYB University platform.

