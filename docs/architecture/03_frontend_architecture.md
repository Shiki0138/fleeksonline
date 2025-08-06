# Frontend Architecture

## Next.js 14 Application Structure

### Project Structure
```
src/frontend/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/            # Auth group routes
│   │   ├── login/         
│   │   └── register/      
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── projects/      
│   │   ├── tasks/         
│   │   └── settings/      
│   ├── api/               # API routes
│   │   └── auth/          
│   ├── globals.css        
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Global loading UI
│   ├── error.tsx          # Global error UI
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components  
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── store/                # State management
├── services/             # API services
├── types/                # TypeScript type definitions
└── utils/                # Helper utilities
```

## Component Architecture

### Design System Components

#### Base UI Components (`components/ui/`)

```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

#### Other Base Components
- `Input`: Text input with validation states
- `Card`: Content containers
- `Modal`: Dialog/modal overlays  
- `Table`: Data tables with sorting/pagination
- `Select`: Dropdown selections
- `Badge`: Status indicators
- `Avatar`: User profile images
- `Skeleton`: Loading placeholders
- `Toast`: Notification messages

### Feature Components (`components/features/`)

#### Authentication
```typescript
// components/features/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      router.push('/dashboard')
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid email or password.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

#### Project Management
```typescript
// components/features/projects/project-card.tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, Target } from 'lucide-react'
import { Project } from '@/types/project'
import { formatDate } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = (project.taskCounts.done / project.taskCounts.total) * 100

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target size={14} />
            <span>{project.taskCounts.total} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(project.endDate)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span className="text-sm text-muted-foreground">
              {project.organization.name}
            </span>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.createdBy.avatarUrl} />
            <AvatarFallback>
              {project.createdBy.firstName[0]}{project.createdBy.lastName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Task Management
```typescript
// components/features/tasks/task-list.tsx
'use client'

import { useState, useMemo } from 'react'
import { Task, TaskStatus } from '@/types/task'
import { TaskItem } from './task-item'
import { TaskFilters } from './task-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate: () => void
}

export function TaskList({ tasks, onTaskUpdate, onTaskCreate }: TaskListProps) {
  const [filters, setFilters] = useState({
    status: 'all' as TaskStatus | 'all',
    assignee: 'all',
    priority: 'all',
    search: '',
  })

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) return false
      if (filters.assignee !== 'all' && task.assignedTo?.id !== filters.assignee) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [tasks, filters])

  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter(task => task.status === 'todo'),
      in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
      review: filteredTasks.filter(task => task.status === 'review'),
      done: filteredTasks.filter(task => task.status === 'done'),
    }
  }, [filteredTasks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TaskFilters filters={filters} onFiltersChange={setFilters} />
        <Button onClick={onTaskCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium capitalize">
                {status.replace('_', ' ')}
              </h3>
              <span className="text-sm text-muted-foreground">
                {statusTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {statusTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={onTaskUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## State Management with Zustand

```typescript
// store/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthTokens } from '@/types/auth'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setTokens: (tokens) => set({ tokens }),
      
      clearAuth: () => set({ 
        user: null, 
        tokens: null, 
        isAuthenticated: false 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

// store/project-store.ts
import { create } from 'zustand'
import type { Project } from '@/types/project'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  
  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  setCurrentProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  setProjects: (projects) => set({ projects }),
  
  addProject: (project) => set((state) => ({ 
    projects: [...state.projects, project] 
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ),
    currentProject: state.currentProject?.id === id 
      ? { ...state.currentProject, ...updates } 
      : state.currentProject
  })),
  
  setCurrentProject: (currentProject) => set({ currentProject }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

## Custom Hooks

```typescript
// hooks/use-auth.ts
import { useAuthStore } from '@/store/auth-store'
import { authService } from '@/services/auth-service'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { user, tokens, isAuthenticated, setUser, setTokens, clearAuth, setLoading } = useAuthStore()
  const router = useRouter()

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setTokens(response.tokens)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (tokens?.refreshToken) {
        await authService.logout(tokens.refreshToken)
      }
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  const refreshToken = async () => {
    if (!tokens?.refreshToken) return false
    
    try {
      const response = await authService.refresh(tokens.refreshToken)
      setTokens(response.tokens)
      return true
    } catch {
      clearAuth()
      router.push('/login')
      return false
    }
  }

  return {
    user,
    tokens,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  }
}

// hooks/use-api.ts
import useSWR from 'swr'
import { apiService } from '@/services/api-service'

export function useApi<T>(url: string | null, options?: any) {
  const { data, error, isLoading, mutate } = useSWR(
    url,
    apiService.get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...options,
    }
  )

  return {
    data: data as T,
    error,
    isLoading,
    mutate,
  }
}

// hooks/use-projects.ts
export function useProjects() {
  const { data, error, isLoading, mutate } = useApi<Project[]>('/projects')
  
  const createProject = async (projectData: CreateProjectData) => {
    const newProject = await apiService.post('/projects', projectData)
    mutate([...(data || []), newProject], false)
    return newProject
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updatedProject = await apiService.put(`/projects/${id}`, updates)
    mutate(
      data?.map(p => p.id === id ? updatedProject : p),
      false
    )
    return updatedProject
  }

  return {
    projects: data || [],
    error,
    isLoading,
    createProject,
    updateProject,
    refetch: mutate,
  }
}
```

## Responsive Design Strategy

### Breakpoints (Tailwind CSS)
```javascript
const breakpoints = {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Layout Components
```typescript
// components/layout/responsive-layout.tsx
interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export function ResponsiveLayout({ children, sidebar, header }: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {header && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          {header}
        </header>
      )}
      
      <div className="flex">
        {sidebar && (
          <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Performance Optimizations

### Code Splitting
```typescript
// Dynamic imports for heavy components
const ProjectChart = dynamic(() => import('@/components/features/projects/project-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const TaskCalendar = dynamic(() => import('@/components/features/tasks/task-calendar'), {
  loading: () => <CalendarSkeleton />,
})
```

### Image Optimization
```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300, 
  className,
  priority = false 
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('rounded-lg object-cover', className)}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

### Virtual Scrolling for Large Lists
```typescript
// components/ui/virtual-list.tsx
import { FixedSizeList as List } from 'react-window'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  height: number
  renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode
}

export function VirtualList<T>({ items, itemHeight, height, renderItem }: VirtualListProps<T>) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
    >
      {renderItem}
    </List>
  )
}
```

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast compliance (WCAG AA)
- Reduced motion preferences

## SEO Optimization

- Next.js App Router with metadata API
- Dynamic meta tags
- Open Graph and Twitter cards
- Structured data (JSON-LD)
- Sitemap generation
- Robot.txt configuration