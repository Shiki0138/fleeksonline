# Frontend Architecture - Task Management Platform

## 1. FRONTEND ARCHITECTURE OVERVIEW

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Zustand for lightweight, type-safe state management
- **UI Library**: Material-UI (MUI) for consistent design system
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors for API communication
- **Real-time**: Socket.io client for WebSocket connections
- **Routing**: React Router v6 for client-side routing
- **Testing**: Vitest + React Testing Library
- **Styling**: Emotion (CSS-in-JS) with MUI theme system

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── forms/           # Form components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── ui/              # UI-specific components
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard page
│   ├── projects/        # Project-related pages
│   ├── tasks/           # Task-related pages
│   └── profile/         # User profile pages
├── hooks/               # Custom React hooks
│   ├── api/             # API-related hooks
│   ├── auth/            # Authentication hooks
│   └── utils/           # Utility hooks
├── store/               # Zustand store slices
│   ├── auth.ts          # Authentication state
│   ├── projects.ts      # Projects state
│   ├── tasks.ts         # Tasks state
│   └── ui.ts            # UI state (modals, notifications)
├── services/            # API services and utilities
│   ├── api/             # API client and endpoints
│   ├── auth/            # Authentication service
│   ├── websocket/       # WebSocket service
│   └── storage/         # Local/session storage utilities
├── types/               # TypeScript type definitions
│   ├── api.ts           # API response types
│   ├── auth.ts          # Authentication types
│   ├── entities.ts      # Entity types (User, Project, Task)
│   └── ui.ts            # UI-related types
├── utils/               # Utility functions
│   ├── constants.ts     # Application constants
│   ├── helpers.ts       # Helper functions
│   ├── validation.ts    # Validation schemas
│   └── formatters.ts    # Data formatting utilities
├── styles/              # Global styles and theme
│   ├── theme.ts         # MUI theme configuration
│   ├── global.css       # Global CSS styles
│   └── variables.css    # CSS custom properties
└── assets/              # Static assets
    ├── images/          # Images and icons
    └── fonts/           # Custom fonts
```

## 2. COMPONENT ARCHITECTURE

### Component Hierarchy
```
App
├── AuthProvider
├── ThemeProvider
├── Router
    ├── PublicRoutes
    │   ├── LoginPage
    │   ├── RegisterPage
    │   ├── ForgotPasswordPage
    │   └── ResetPasswordPage
    └── PrivateRoutes
        ├── Layout
        │   ├── Header
        │   ├── Sidebar
        │   └── MainContent
        ├── DashboardPage
        ├── ProjectsPage
        │   ├── ProjectList
        │   ├── ProjectDetail
        │   └── ProjectForm
        ├── TasksPage
        │   ├── TaskBoard (Kanban)
        │   ├── TaskList
        │   ├── TaskDetail
        │   └── TaskForm
        └── ProfilePage
```

### Component Design Patterns

#### Container/Presentation Pattern
```typescript
// Container Component (Logic)
const TaskListContainer: React.FC = () => {
  const { tasks, loading, error } = useTasksStore();
  const { fetchProjectTasks } = useTasksApi();
  
  useEffect(() => {
    fetchProjectTasks(projectId);
  }, [projectId]);

  return (
    <TaskListPresentation
      tasks={tasks}
      loading={loading}
      error={error}
      onTaskClick={handleTaskClick}
    />
  );
};

// Presentation Component (UI)
interface TaskListPresentationProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onTaskClick: (task: Task) => void;
}

const TaskListPresentation: React.FC<TaskListPresentationProps> = ({
  tasks,
  loading,
  error,
  onTaskClick
}) => {
  if (loading) return <CircularProgress />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <List>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onClick={() => onTaskClick(task)}
        />
      ))}
    </List>
  );
};
```

#### Compound Component Pattern
```typescript
// Card compound component
const Card = ({ children, className }: CardProps) => (
  <div className={`card ${className}`}>{children}</div>
);

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="card-body">{children}</div>
);

Card.Footer = ({ children }: { children: React.ReactNode }) => (
  <div className="card-footer">{children}</div>
);

// Usage
<Card>
  <Card.Header>Task Details</Card.Header>
  <Card.Body>Task content here</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

## 3. STATE MANAGEMENT

### Zustand Store Architecture

#### Authentication Store
```typescript
// store/auth.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokens: {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  },

  // Actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const { user, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      set({
        user,
        isAuthenticated: true,
        tokens,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      isAuthenticated: false,
      tokens: { accessToken: null, refreshToken: null },
    });
  },

  // ... other actions
}));
```

#### Projects Store
```typescript
// store/projects.ts
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: ProjectStatus | 'all';
    sortBy: 'name' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProjectsActions {
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProjectsState['filters']>) => void;
  setPagination: (pagination: Partial<ProjectsState['pagination']>) => void;
}

export const useProjectsStore = create<ProjectsState & ProjectsActions>((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  // Actions
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const response = await projectsService.getProjects({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      set({
        projects: response.data.data,
        pagination: {
          ...pagination,
          total: response.data.meta.pagination.total,
          totalPages: response.data.meta.pagination.totalPages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch projects',
        loading: false,
      });
    }
  },

  // ... other actions
}));
```

#### Tasks Store
```typescript
// store/tasks.ts
interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    assigneeId: string | 'all';
    labelIds: string[];
  };
  view: 'list' | 'board' | 'calendar';
}

interface TasksActions {
  fetchTasks: (projectId: string) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (projectId: string, data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TasksState['filters']>) => void;
  setView: (view: TasksState['view']) => void;
}
```

### State Composition Pattern
```typescript
// Combined store for complex components
const useProjectTasksData = (projectId: string) => {
  const project = useProjectsStore(state => state.currentProject);
  const tasks = useTasksStore(state => state.tasks);
  const loading = useProjectsStore(state => state.loading) || useTasksStore(state => state.loading);
  
  return {
    project,
    tasks,
    loading,
    // Derived state
    tasksByStatus: tasks.reduce((acc, task) => {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>),
  };
};
```

## 4. ROUTING ARCHITECTURE

### Route Configuration
```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { GuestRoute } from '../components/auth/GuestRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: '/login',
        element: <GuestRoute><LoginPage /></GuestRoute>,
      },
      {
        path: '/register',
        element: <GuestRoute><RegisterPage /></GuestRoute>,
      },
      {
        path: '/forgot-password',
        element: <GuestRoute><ForgotPasswordPage /></GuestRoute>,
      },
      {
        path: '/reset-password/:token',
        element: <GuestRoute><ResetPasswordPage /></GuestRoute>,
      },
      
      // Protected routes
      {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'projects',
            children: [
              {
                index: true,
                element: <ProjectsPage />,
              },
              {
                path: 'new',
                element: <CreateProjectPage />,
              },
              {
                path: ':projectId',
                element: <ProjectDetailPage />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="tasks" replace />,
                  },
                  {
                    path: 'tasks',
                    element: <TasksPage />,
                  },
                  {
                    path: 'tasks/new',
                    element: <CreateTaskPage />,
                  },
                  {
                    path: 'tasks/:taskId',
                    element: <TaskDetailPage />,
                  },
                  {
                    path: 'members',
                    element: <ProjectMembersPage />,
                  },
                  {
                    path: 'settings',
                    element: <ProjectSettingsPage />,
                  },
                ],
              },
            ],
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);
```

### Route Guards
```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## 5. FORM HANDLING

### Form Architecture with React Hook Form + Zod
```typescript
// hooks/forms/useTaskForm.ts
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  labelIds: z.array(z.string().uuid()).default([]),
});

type TaskFormData = z.infer<typeof taskSchema>;

export const useTaskForm = (initialValues?: Partial<TaskFormData>) => {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      labelIds: [],
      ...initialValues,
    },
  });

  const { createTask, updateTask } = useTasksStore();

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (initialValues?.id) {
        await updateTask(initialValues.id, data);
      } else {
        await createTask(projectId, data);
      }
      form.reset();
    } catch (error) {
      form.setError('root', {
        message: error.response?.data?.message || 'Operation failed',
      });
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: form.formState.isSubmitting,
  };
};
```

### Form Components
```typescript
// components/forms/TaskForm.tsx
interface TaskFormProps {
  initialValues?: Partial<Task>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSuccess,
  onCancel,
}) => {
  const { form, onSubmit, isLoading } = useTaskForm(initialValues);
  const { users } = useProjectMembersStore();
  const { labels } = useLabelsStore();

  return (
    <form onSubmit={onSubmit}>
      <FormField
        name="title"
        label="Title"
        control={form.control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            error={!!form.formState.errors.title}
            helperText={form.formState.errors.title?.message}
          />
        )}
      />

      <FormField
        name="description"
        label="Description"
        control={form.control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            multiline
            rows={4}
          />
        )}
      />

      <FormField
        name="assigneeId"
        label="Assignee"
        control={form.control}
        render={({ field }) => (
          <Select {...field} fullWidth>
            <MenuItem value="">Unassigned</MenuItem>
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {initialValues ? 'Update' : 'Create'} Task
        </Button>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Box>
    </form>
  );
};
```

## 6. REAL-TIME ARCHITECTURE

### WebSocket Service
```typescript
// services/websocket/socketService.ts
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io('/api/v1/ws', {
      auth: { token },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string) {
    this.socket?.emit('join-project', { projectId });
  }

  leaveProject(projectId: string) {
    this.socket?.emit('leave-project', { projectId });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
      if (reason === 'io server disconnect') {
        this.reconnect();
      }
    });

    this.socket.on('task:created', (task: Task) => {
      useTasksStore.getState().addTask(task);
      useNotificationsStore.getState().addNotification({
        type: 'info',
        message: `New task created: ${task.title}`,
      });
    });

    this.socket.on('task:updated', (task: Task) => {
      useTasksStore.getState().updateTask(task);
    });

    this.socket.on('task:status-changed', ({ taskId, status, updatedBy }) => {
      useTasksStore.getState().updateTaskStatus(taskId, status);
      if (updatedBy !== useAuthStore.getState().user?.id) {
        useNotificationsStore.getState().addNotification({
          type: 'info',
          message: `Task status changed to ${status}`,
        });
      }
    });

    // ... other event listeners
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(useAuthStore.getState().tokens.accessToken!);
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }
}

export const socketService = new SocketService();
```

### Real-time Hooks
```typescript
// hooks/useRealTimeUpdates.ts
export const useRealTimeUpdates = (projectId?: string) => {
  const { isAuthenticated, tokens } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && tokens.accessToken) {
      socketService.connect(tokens.accessToken);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, tokens.accessToken]);

  useEffect(() => {
    if (projectId && socketService.socket?.connected) {
      socketService.joinProject(projectId);

      return () => {
        socketService.leaveProject(projectId);
      };
    }
  }, [projectId]);
};
```

## 7. PERFORMANCE OPTIMIZATIONS

### Code Splitting & Lazy Loading
```typescript
// Lazy load page components
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage'));
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'));

// Route-based code splitting
{
  path: 'dashboard',
  element: (
    <Suspense fallback={<PageLoadingSpinner />}>
      <DashboardPage />
    </Suspense>
  ),
}
```

### Memoization Strategies
```typescript
// Component memoization
export const TaskItem = React.memo<TaskItemProps>(({ task, onClick }) => {
  return (
    <ListItem button onClick={() => onClick(task)}>
      <TaskItemContent task={task} />
    </ListItem>
  );
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.updatedAt === nextProps.task.updatedAt;
});

// Hook memoization
export const useFilteredTasks = (tasks: Task[], filters: TaskFilters) => {
  return useMemo(() => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);
};
```

### Virtual Scrolling for Large Lists
```typescript
// components/common/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (props: { index: number; data: T[] }) => React.ReactNode;
}

export const VirtualizedList = <T,>({
  items,
  itemHeight,
  renderItem,
}: VirtualizedListProps<T>) => {
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
};
```

## 8. TESTING ARCHITECTURE

### Component Testing
```typescript
// __tests__/components/TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../components/tasks/TaskItem';
import { mockTask } from '../__mocks__/tasks';

describe('TaskItem', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders task information correctly', () => {
    render(<TaskItem task={mockTask} onClick={mockOnClick} />);
    
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.status)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<TaskItem task={mockTask} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockTask);
  });
});
```

### Hook Testing
```typescript
// __tests__/hooks/useTasksStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTasksStore } from '../store/tasks';
import * as tasksService from '../services/api/tasks';

jest.mock('../services/api/tasks');

describe('useTasksStore', () => {
  beforeEach(() => {
    useTasksStore.setState({
      tasks: [],
      loading: false,
      error: null,
    });
  });

  it('fetches tasks successfully', async () => {
    const mockTasks = [mockTask1, mockTask2];
    (tasksService.getTasks as jest.Mock).mockResolvedValue({
      data: { data: mockTasks }
    });

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.fetchTasks('project-id');
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.loading).toBe(false);
  });
});
```

## 9. ACCESSIBILITY

### ARIA Labels and Semantic HTML
```typescript
// Accessible form components
<form role="form" aria-labelledby="task-form-title">
  <h2 id="task-form-title">Create New Task</h2>
  
  <TextField
    label="Task Title"
    required
    aria-describedby="title-help"
    error={!!errors.title}
    aria-invalid={!!errors.title}
  />
  {errors.title && (
    <FormHelperText id="title-help" error>
      {errors.title.message}
    </FormHelperText>
  )}
</form>

// Accessible navigation
<nav role="navigation" aria-label="Main Navigation">
  <ul>
    <li>
      <Link
        to="/dashboard"
        aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
      >
        Dashboard
      </Link>
    </li>
  </ul>
</nav>
```

### Keyboard Navigation
```typescript
// Custom hook for keyboard navigation
export const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        onSelect(items[selectedIndex]);
        break;
    }
  }, [items, selectedIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return selectedIndex;
};
```

This frontend architecture provides a scalable, maintainable, and performant React application with modern best practices, type safety, and excellent user experience.