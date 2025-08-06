# Fleeks Frontend

A modern React frontend for the Fleeks Task Management & Collaboration Platform.

## Features

- **Authentication**: Login, registration, and protected routes
- **Project Management**: Create, edit, and manage projects
- **Task Management**: Full task lifecycle with comments and real-time updates
- **Real-time Collaboration**: Socket.io integration for live updates
- **Responsive Design**: Material-UI components with mobile-first approach
- **Type Safety**: Full TypeScript integration
- **State Management**: Zustand for efficient state management
- **Form Validation**: React Hook Form with Zod schemas

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Material-UI (MUI)** for UI components
- **Zustand** for state management
- **React Router** for navigation
- **React Hook Form** + **Zod** for form handling
- **Axios** for API calls with interceptors
- **Socket.io Client** for real-time features
- **React Query** for server state management

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable UI components
│   ├── auth/      # Authentication components
│   ├── layout/    # Layout components
│   ├── projects/  # Project-related components
│   ├── tasks/     # Task-related components
│   └── common/    # Shared components
├── pages/         # Page components
├── stores/        # Zustand stores
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── hooks/         # Custom React hooks
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API endpoints.

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Development

### Adding New Components

1. Create component in appropriate directory
2. Export from index file if needed
3. Add to routing if it's a page component
4. Update store if it manages state

### State Management

The app uses Zustand stores for state management:

- `authStore`: User authentication and profile
- `projectStore`: Project management
- `taskStore`: Task operations and real-time updates
- `socketStore`: WebSocket connections and notifications

### API Integration

All API calls go through the centralized `apiClient` with:

- Automatic token management
- Request/response interceptors
- Error handling
- Token refresh logic

### Real-time Features

Socket.io integration provides:

- Live task updates
- Real-time notifications
- Activity feed updates
- Collaborative editing indicators

## Environment Variables

- `VITE_API_URL`: Backend API base URL
- `VITE_SOCKET_URL`: Socket.io server URL
- `VITE_NODE_ENV`: Environment (development/production)

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript checks

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Write meaningful component and function names
4. Add proper error handling
5. Test real-time features thoroughly
6. Ensure responsive design on all screen sizes

## Authentication Flow

1. User enters credentials on login/register page
2. API returns access/refresh tokens
3. Tokens stored in localStorage and Zustand
4. Axios interceptor adds tokens to requests
5. Protected routes check authentication status
6. Socket connects with access token for real-time features

## Key Features Implementation

### Real-time Updates
- Socket.io client connects on authentication
- Event listeners update Zustand stores
- UI automatically reflects changes
- Notifications shown for important events

### Form Handling
- React Hook Form for performance
- Zod schemas for validation
- Consistent error display
- Loading states during submission

### Responsive Design
- Material-UI Grid system
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly interactions

## Performance Optimizations

- Vite for fast development builds
- React.memo for expensive components
- Zustand for minimal re-renders
- React Query for server state caching
- Code splitting with lazy loading
- Optimized bundle with tree shaking