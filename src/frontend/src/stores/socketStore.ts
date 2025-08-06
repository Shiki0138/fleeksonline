import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { NotificationData } from '@/types';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationData[];
  unreadCount: number;
}

interface SocketActions {
  connect: (token: string) => void;
  disconnect: () => void;
  addNotification: (notification: NotificationData) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

export const useSocketStore = create<SocketState & SocketActions>((set, get) => ({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,

  connect: (token: string) => {
    const { socket } = get();
    
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      set({ isConnected: false });
    });

    // Handle real-time events
    newSocket.on('task_created', (data) => {
      // This would be handled by the task store
      // We emit a custom event for the task store to listen to
      window.dispatchEvent(new CustomEvent('socket:task_created', { detail: data }));
      
      get().addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'New Task Created',
        message: `Task "${data.title}" has been created`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    newSocket.on('task_updated', (data) => {
      window.dispatchEvent(new CustomEvent('socket:task_updated', { detail: data }));
      
      get().addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'Task Updated',
        message: `Task "${data.title}" has been updated`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    newSocket.on('task_deleted', (data) => {
      window.dispatchEvent(new CustomEvent('socket:task_deleted', { detail: data }));
      
      get().addNotification({
        id: Date.now().toString(),
        type: 'warning',
        title: 'Task Deleted',
        message: `Task has been deleted`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    newSocket.on('comment_added', (data) => {
      window.dispatchEvent(new CustomEvent('socket:comment_added', { detail: data }));
      
      get().addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'New Comment',
        message: `New comment added to task "${data.task.title}"`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    newSocket.on('project_updated', (data) => {
      window.dispatchEvent(new CustomEvent('socket:project_updated', { detail: data }));
      
      get().addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'Project Updated',
        message: `Project "${data.name}" has been updated`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  addNotification: (notification: NotificationData) => {
    set((state) => ({
      notifications: [notification, ...state.notifications.slice(0, 49)], // Keep only 50 notifications
      unreadCount: state.unreadCount + 1,
    }));
  },

  markNotificationAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));