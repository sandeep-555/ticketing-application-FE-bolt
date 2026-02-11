# Ticketing Management System - Frontend

Production-grade React frontend for the ticketing management system with enterprise features.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **React Router v6** - Routing with guards
- **TailwindCSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client with interceptors
- **ExcelJS** - Export functionality
- **React DnD** - Drag and drop for Kanban

## Design System

### Colors

- **Background:** White / Dark Gray-900
- **Containers:** #BAD4F3 (glass/frosted effect)
- **Primary:** #052350
- **Secondary:** #0676CF
- **Danger:** #EA1E28

### Features

- Dark mode toggle
- Glass morphism effects
- Responsive design
- Accessible components
- Loading states
- Error boundaries

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Select.jsx
│   │   └── Loading.jsx
│   ├── layout/          # Layout components
│   │   └── Layout.jsx
│   └── guards/          # Route guards
│       └── ProtectedRoute.jsx
├── pages/
│   ├── auth/            # Authentication pages
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── projects/        # Project management
│   │   └── ProjectsListPage.jsx
│   ├── board/           # Kanban board
│   │   └── BoardPage.jsx
│   ├── reports/         # Reports and exports
│   │   └── ReportsPage.jsx
│   ├── client/          # Customer portal
│   │   └── ClientPortalPage.jsx
│   └── DashboardPage.jsx
├── services/
│   ├── api/             # API services
│   │   ├── axios.js
│   │   ├── auth.api.js
│   │   ├── projects.api.js
│   │   ├── tickets.api.js
│   │   └── board.api.js
│   └── socket/          # Socket.IO wrapper
│       └── socket.js
├── store/
│   ├── slices/          # Redux slices
│   │   ├── authSlice.js
│   │   └── themeSlice.js
│   └── store.js
├── config/
│   ├── constants.js     # App constants
│   └── react-query.js   # React Query config
├── utils/
│   └── cn.js            # Utility functions
├── App.jsx              # Main app with routing
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## Features

### Authentication
- Login / Register
- JWT token management
- Auto token refresh
- RBAC (Role-Based Access Control)
- Socket connection after login

### Dashboard
- Overview statistics
- Recent projects
- Quick actions
- Role-specific views

### Projects
- List all projects
- Create new project
- View project details
- Manage project members
- Role-based permissions

### Kanban Board
- Drag & drop interface
- Real-time updates via Socket.IO
- Filter by project
- Bulk status updates
- Visual status columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)

### Reports & Exports
- Export tickets to Excel/CSV
- Export time logs
- Monthly effort reports
- DEV vs BAU breakdown
- Developer performance reports
- Configurable date ranges and filters

### Client Portal (Customers)
- Create support tickets
- View own tickets only
- Add comments
- Upload attachments
- Restricted access to internal data

### Real-time Features
- Socket.IO integration
- Auto-reconnection
- Project room subscriptions
- Live board updates
- Instant notifications

### Security
- Protected routes
- Role-based access control
- Automatic token refresh
- Activity logging
- XSS protection

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
cd client
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

Configure `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

Built files will be in `dist/` directory.

Preview production build:
```bash
npm run preview
```

## Usage

### Default Credentials

After running the backend setup, use these credentials:

**Admin User:**
- Email: `admin@ticketing.com`
- Password: `Admin@123`

**Register New User:**
- Navigate to `/register`
- Choose role: CUSTOMER or AGENT
- ADMIN and MANAGER roles must be created via database

### Role Permissions

**ADMIN**
- Full system access
- Manage all projects
- View all tickets
- Access reports and exports

**MANAGER**
- Manage assigned projects
- Approve ticket actions
- View project reports
- Manage project members

**AGENT**
- Create and edit tickets
- Update ticket status
- Add comments
- Log time

**CUSTOMER**
- Create support tickets
- View own tickets only
- Add comments (non-internal)
- Limited field access

### Key Features

#### Kanban Board
1. Select a project
2. Drag tickets between columns
3. Real-time updates reflect immediately
4. Filter by work category, priority, assignee

#### Exports
1. Navigate to Reports page
2. Select export type
3. Configure filters (dates, projects, etc.)
4. Choose format (Excel or CSV)
5. Download file

#### Dark Mode
- Toggle using moon/sun icon in navbar
- Preference saved to localStorage
- Smooth transitions

## API Integration

### Axios Configuration

- Base URL: Configured in `.env`
- Request interceptor: Adds JWT token
- Response interceptor: Handles token refresh
- Error handling: Automatic retry on 401

### React Query

- Caching: 5 minutes stale time
- Automatic refetch on mutation
- Optimistic updates for better UX
- Dev tools for debugging

### Socket.IO

- Auto-connect after login
- Join project rooms automatically
- Listen to events:
  - `ticket_updated`
  - `board_updated`
  - `bulk_status_changed`
  - `approval_updated`
  - `notification`

## Component Library

### Button
```jsx
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `danger`, `outline`, `ghost`

### Input
```jsx
<Input
  label="Email"
  type="email"
  error="Error message"
  {...register('email')}
/>
```

### Modal
```jsx
<Modal isOpen={true} onClose={handleClose} title="Modal Title" size="md">
  <p>Modal content</p>
</Modal>
```

Sizes: `sm`, `md`, `lg`, `xl`

### Card
```jsx
<Card glass>
  <CardHeader>Header</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Badge
```jsx
<Badge status="IN_PROGRESS">Status</Badge>
<Badge priority="HIGH">Priority</Badge>
<Badge variant="success">Custom</Badge>
```

## Development

### Code Style

- Use functional components
- Hooks for state management
- PropTypes or TypeScript for type safety
- Meaningful component names
- Reusable utilities

### State Management

**Redux (Global State):**
- Authentication state
- Theme preference
- User profile

**React Query (Server State):**
- Projects data
- Tickets data
- Board state
- Reports

**Local State:**
- Modal open/close
- Form inputs
- UI interactions

### Best Practices

1. **Component Organization**
   - One component per file
   - Colocate related components
   - Extract reusable logic to hooks

2. **Performance**
   - Lazy load routes
   - Memoize expensive computations
   - Optimize re-renders
   - Use React Query cache

3. **Error Handling**
   - Try-catch in async functions
   - Toast notifications for errors
   - Fallback UI for errors
   - Loading states

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Color contrast

## Troubleshooting

### Common Issues

**Cannot connect to API:**
- Check if backend is running
- Verify VITE_API_URL in `.env`
- Check CORS settings

**Socket.IO not connecting:**
- Ensure token is valid
- Check VITE_SOCKET_URL
- Verify backend Socket.IO server

**Dark mode not working:**
- Clear localStorage
- Check theme class on html element
- Verify Tailwind dark mode config

**Build fails:**
- Clear node_modules and reinstall
- Check for missing dependencies
- Verify Node.js version

## Testing

Run tests (when implemented):
```bash
npm test
```

## Deployment

### Build Steps

1. Update environment variables for production
2. Run build command
3. Test production build locally
4. Deploy `dist/` folder to hosting

### Hosting Options

- **Vercel** - Recommended for React apps
- **Netlify** - Great for static sites
- **AWS S3 + CloudFront** - Enterprise solution
- **Docker** - Containerized deployment

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

ISC

## Support

For issues or questions:
- Check backend API documentation
- Review Redux DevTools
- Check React Query DevTools
- Inspect Network tab for API calls
