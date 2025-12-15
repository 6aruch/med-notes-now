# 🏥 Healthcare Management System

A comprehensive healthcare management platform built with React, TypeScript, and Supabase. This system enables secure patient-doctor interactions, appointment scheduling, medical records management, and KYC verification.

## ✨ Features

### 👥 Multi-Role System

* **Patients**: Book appointments, view medical records, manage profile
* **Doctors**: Manage appointments, create medical records, view patient history
* **Admins**: Approve doctors, verify KYC documents, manage users

### 🔐 Security Features

* Role-based access control (RBAC)
* Row-level security (RLS) policies
* Server-side role verification
* KYC document verification
* Secure authentication with Supabase
* Error message sanitization

### 📋 Core Functionality

* **Appointment Management**: Schedule, view, and manage appointments
* **Medical Records**: Secure storage of diagnoses, prescriptions, and lab results
* **KYC Verification**: Government ID verification for patients
* **Doctor Approval Workflow**: Admin approval required before doctors can practice
* **Real-time Updates**: Live data synchronization across users

## 🚀 Getting Started

### Prerequisites

* Node.js (v20 or higher)
* npm or yarn
* Supabase account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/6aruch/med-notes-now.git
cd med-notes-now
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database**

Run the SQL scripts in your Supabase SQL editor:

* Create tables (users, appointments, medical_records, kyc_documents, user_roles)
* Set up RLS policies
* Create the `verify_user_role()` function
* Enable necessary extensions

5. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 🏗️ Tech Stack

### Frontend

* **React** - UI framework
* **TypeScript** - Type safety
* **Vite** - Build tool
* **Tailwind CSS** - Styling
* **shadcn/ui** - UI components
* **React Query** - Data fetching
* **Zod** - Input validation

### Backend

* **Supabase** - Backend as a Service
  + PostgreSQL database
  + Authentication
  + Row Level Security
  + Real-time subscriptions
  + Storage for documents

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── hooks/              # Custom React hooks
├── integrations/       # Supabase integration
├── pages/              # Page components
│   ├── Auth.tsx
│   ├── PatientDashboard.tsx
│   ├── DoctorDashboard.tsx
│   └── AdminDashboard.tsx
├── lib/                # Utilities
└── types/              # TypeScript types
```

## 🗄️ Database Schema

### Core Tables

* **users**: User profiles (extends Supabase auth.users)
* **user_roles**: Role assignments (patient, doctor, admin)
* **appointments**: Appointment bookings
* **medical_records**: Patient medical history
* **kyc_documents**: Identity verification documents

## 🔒 Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with specific policies for data access control.

### Input Validation

* Zod schemas for all forms
* Password strength requirements
* Format validation for emails, phones, dates
* Sanitization of user inputs

### Authentication

* Email/password authentication via Supabase
* Secure session management
* Role-based route protection
* Server-side role verification

## 👨‍💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🚦 User Workflows

### Patient Journey

1. Sign up and complete KYC verification
2. Wait for admin approval
3. Browse and book appointments with doctors
4. View medical records and prescriptions

### Doctor Journey

1. Sign up with license number
2. Wait for admin approval
3. View assigned appointments
4. Create and manage medical records

### Admin Journey

1. Access admin dashboard
2. Approve/reject doctor applications
3. Verify KYC documents
4. Manage system users

## 🛣️ Roadmap

* Email notifications for appointments
* SMS reminders
* Video consultation integration
* Prescription e-signatures
* HIPAA compliance audit
* Multi-language support
* Mobile app (React Native)
* Analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a demonstration project. For production use with real patient data:

* Conduct professional security audits
* Ensure HIPAA compliance (if US-based)
* Implement additional backup systems
* Add comprehensive error logging
* Set up monitoring and alerting
* Consult legal counsel for healthcare regulations

## 📞 Support

For issues and questions:

* Open an issue on GitHub
* Contact: 6aruch@gmail.com

## 🙏 Acknowledgments

* UI components from [shadcn/ui](https://ui.shadcn.com)
* Backend powered by [Supabase](https://supabase.com)
* Icons from [Lucide](https://lucide.dev)

---

**⚡ Built with passion for better healthcare technology**
