# CRMP Project File Structure & Dependencies

**Project:** Campus Resource Management Platform
**Team:** APEX PREDATORS
**Framework:** Next.js 14 + TypeScript + Tailwind CSS + Supabase
**Updated:** 2026-07-29

---

## File Structure

```
crmp/
├── .env.local                    # Environment variables (gitignored)
├── .gitignore                    # Git ignore rules
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked versions (auto-generated)
├── README.md                     # Project overview & setup guide
├── PRD.md                        # Product Requirements Document
├── TRD.md                        # Technical Requirements Document
├── Business Logic.md             # Business logic & rules
├── Backend Schema.md             # Database schema & RLS policies
├── UI-UX Design Doc.md           # UI/UX design specifications
├── App Flow.md                   # User flow diagrams
├── Implementation Plan.md         # Day-by-day plan & checklist
├── Algorithms.md                 # All core algorithms with pseudocode
├── PROJECT_OVERVIEW.md           # Team onboarding document
├── UI-Demo.html                  # Visual design demo (open in browser)
├── APEX PREDATORS.pptx           # Original hackathon presentation
├── APEX PREDATORS_updated.pptx   # Updated presentation
│
├── app/                          # Next.js App Router
│   ├── layout.jsx                # Root layout with providers
│   ├── page.jsx                  # Landing / Login page
│   ├── globals.css               # Global styles + Tailwind imports
│   │
│   ├── dashboard/
│   │   ├── page.jsx              # Main dashboard with calendar
│   │   └── layout.jsx            # Dashboard layout + sidebar
│   │
│   ├── resources/
│   │   ├── page.jsx              # Resource search & listing
│   │   └── [id]/
│   │       └── page.jsx          # Resource detail + booking form
│   │
│   ├── bookings/
│   │   ├── page.jsx              # My bookings list
│   │   └── [id]/
│   │       └── page.jsx          # Booking detail + QR display
│   │
│   ├── admin/
│   │   ├── page.jsx              # Admin dashboard overview
│   │   ├── resources/
│   │   │   └── page.jsx          # Resource management CRUD
│   │   ├── users/
│   │   │   └── page.jsx          # User & role management
│   │   ├── pending/
│   │   │   └── page.jsx          # Pending approvals list
│   │   └── logs/
│   │       └── page.jsx          # Audit log viewer
│   │
│   ├── waitlist/
│   │   └── page.jsx              # My waitlist view
│   │
│   ├── checkin/
│   │   └── page.jsx              # QR scanner page (camera + manual)
│   │
│   └── api/                      # API Routes (backend)
│       └── v1/
│           ├── auth/
│           │   ├── route.js      # POST /login, POST /magic-link
│           │   └── route.js      # POST /logout
│           │
│           ├── users/
│           │   └── route.js      # GET /me (current user profile)
│           │
│           ├── resources/
│           │   ├── route.js      # GET (list with filters)
│           │   └── [id]/
│           │       └── route.js  # GET, PUT, DELETE single resource
│           │
│           ├── bookings/
│           │   ├── route.js      # GET (list) + POST (create)
│           │   └── [id]/
│           │       ├── route.js  # GET (detail)
│           │       └── route.js  # PATCH (status update), DELETE
│           │
│           ├── checkin/
│           │   └── route.js      # POST /api/v1/checkin (QR scan)
│           │
│           ├── waitlist/
│           │   └── [resource_id]/
│           │       ├── route.js  # GET (waitlist for resource)
│           │       └── route.js  # POST (join waitlist)
│           │
│           └── audit-logs/
│               └── route.js      # GET (admin audit logs)
│
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── Calendar.jsx
│   │   ├── CalendarCell.jsx
│   │   ├── Table.jsx
│   │   ├── TableRow.jsx
│   │   ├── SearchInput.jsx
│   │   ├── FilterChip.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Toast.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── features/                 # Feature-specific components
│   │   ├── BookingForm.jsx
│   │   ├── BookingCard.jsx
│   │   ├── BookingDetail.jsx
│   │   ├── ResourceCard.jsx
│   │   ├── ResourceGrid.jsx
│   │   ├── QRCodeDisplay.jsx
│   │   ├── QRScanner.jsx
│   │   ├── WaitlistEntry.jsx
│   │   ├── WaitlistList.jsx
│   │   ├── StateMachine.jsx
│   │   ├── ApprovalActions.jsx
│   │   ├── AuditLogTable.jsx
│   │   ├── UtilizationChart.jsx
│   │   ├── DashboardStats.jsx
│   │   ├── MyBookingsList.jsx
│   │   ├── ConflictDialog.jsx
│   │   ├── WaitlistDialog.jsx
│   │   └── OfflineBanner.jsx
│   │
│   └── layout/                   # Layout components
│       ├── DashboardLayout.jsx
│       ├── AdminLayout.jsx
│       └── MobileBottomNav.jsx
│
├── lib/                          # Utility libraries & configurations
│   ├── supabase.js               # Supabase client instance
│   ├── auth.js                   # Auth helpers (login, logout, getUser)
│   ├── db.js                     # Database query helpers
│   ├── booking.js                # Booking CRUD + conflict lock logic
│   ├── waitlist.js               # Waitlist management functions
│   ├── qr.js                     # QR code generation (qr-code-styling)
│   ├── notifications.js          # Real-time subscription manager
│   ├── offline.js                # IndexedDB + service worker helpers
│   ├── utils.js                  # Shared utility functions
│   ├── constants.js              # App-wide constants (roles, status, etc.)
│   └── validators.js             # Zod schemas for input validation
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.jsx               # Authentication state & methods
│   ├── useBookings.jsx           # Booking CRUD hooks
│   ├── useResources.jsx          # Resource search & CRUD hooks
│   ├── useWaitlist.jsx           # Waitlist management hooks
│   ├── useRealtime.jsx           # Supabase Realtime subscription hook
│   ├── useNotifications.jsx      # In-app notification hook
│   ├── useOffline.jsx            # Offline queue & sync hook
│   └── useDashboard.jsx          # Dashboard data aggregation hook
│
├── types/                        # TypeScript type definitions
│   └── index.d.ts
│
├── public/                       # Static assets
│   ├── icons/                    # App icons ( favicon, etc.)
│   └── qr/                       # Generated QR code cache
│
└── styles/
    └── globals.css               # Tailwind directives + custom CSS
```

---

## Dependencies

### Production Dependencies

```bash
npm install next@14 react@18 react-dom@18
npm install @supabase/supabase-js@2
npm install framer-motion@11
npm install qr-code-styling@1
npm install lucide-react@0
npm install tailwindcss@3 postcss@8 autoprefixer@10
npm install zustand@4              # Lightweight state management (optional - can use React Context)
npm install react-hot-toast@2      # Toast notifications
npm install date-fns@3             # Date formatting and manipulation
npm install clsx@2                 # Conditional CSS class merging
npm install class-variance-authority@0  # Component variant management
```

### Development Dependencies

```bash
npm install -D typescript@5 @types/react@18 @types/react-dom@18 @types/node@20
npm install -D eslint@8 prettier@3
npm install -D @types/qr-code-styling  # Type definitions (if available)
```

### Full Install Command

```bash
# Create project
npx create-next-app@latest crmp --typescript --tailwind --eslint --app --src-dir=false

# cd into project
cd crmp

# Install all dependencies
npm install @supabase/supabase-js@2 framer-motion@11 qr-code-styling@1 lucide-react@0
npm install zustand@4 react-hot-toast@2 date-fns@3 clsx@2 class-variance-authority@0
npm install -D typescript@5 @types/react@18 @types/react-dom@18 @types/node@20
```

### Dependency Summary Table

| Package | Version | Purpose | Required? |
|---------|---------|---------|-----------|
| `next` | 14.x | Framework (SSR, routing, API routes) | **Yes** |
| `react` | 18.x | UI library | **Yes** |
| `react-dom` | 18.x | React DOM rendering | **Yes** |
| `@supabase/supabase-js` | 2.x | Supabase client (auth, DB, realtime) | **Yes** |
| `framer-motion` | 11.x | Animations (if UI member provides templates) | Recommended |
| `qr-code-styling` | 1.x | Branded QR code generation | **Yes** |
| `lucide-react` | 0.x | Icon library | **Yes** |
| `zustand` | 4.x | State management (alternative to React Context) | Optional |
| `react-hot-toast` | 2.x | Toast notifications | **Yes** |
| `date-fns` | 3.x | Date formatting, parsing, comparison | **Yes** |
| `clsx` | 2.x | Conditional CSS class merging | **Yes** |
| `class-variance-authority` | 0.x | Component variant management | Optional |
| `typescript` | 5.x | Type checking | **Yes** (dev) |
| `@types/react` | 18.x | React type definitions | **Yes** (dev) |
| `@types/react-dom` | 18.x | React DOM type definitions | **Yes** (dev) |
| `@types/node` | 20.x | Node.js type definitions | **Yes** (dev) |
| `eslint` | 8.x | Linting | **Yes** (dev) |
| `prettier` | 3.x | Code formatting | Recommended (dev) |
| `tailwindcss` | 3.x | CSS framework | **Yes** |
| `postcss` | 8.x | CSS processing | **Yes** |
| `autoprefixer` | 10.x | CSS vendor prefixes | **Yes** |

---

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional (for email notifications in future)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## Git Commands to Initialize

```bash
# Navigate to project
cd "C:\Campus Resource Management Platform"

# Initialize git
git init

# Create .gitignore
echo ".env.local" >> .gitignore
echo "node_modules" >> .gitignore
echo ".next" >> .gitignore
echo "*.pptx" >> .gitignore
echo "UI-Demo.html" >> .gitignore
echo "convert_to_pdf.py" >> .gitignore
echo "APEX PREDATORS_updated.pptx" >> .gitignore
echo ".env.local" >> .gitignore

# Add all files
git add .

# First commit
git commit -m "Initial commit: CRMP project documentation and structure"

# Create main branch
git branch -M main

# Add remote (your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/crmp.git

# Push
git push -u origin main
```

---

## Quick Start Script (for any team member)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/crmp.git
cd crmp

# 2. Install
npm install

# 3. Configure
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run
npm run dev

# 5. Open browser at http://localhost:3000
```

---

## Total Dependency Count

| Category | Count |
|----------|-------|
| Production | 14 packages |
| Development | 8 packages |
| **Total** | **22 packages** |

All can be installed with a single `npm install` command. No paid packages are required.

---

*End of File Structure & Dependencies*