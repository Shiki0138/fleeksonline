import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';

export const useSocket = () => {
  const { socket, isConnected } = useSocketStore();
  const { updateTaskFromSocket, addTaskFromSocket, removeTaskFromSocket, addCommentFromSocket } = useTaskStore();
  const { fetchProjects } = useProjectStore();

  useEffect(() => {
    if (!socket) return;

    // Task events
    const handleTaskCreated = (event: CustomEvent) => {
      addTaskFromSocket(event.detail);
    };

    const handleTaskUpdated = (event: CustomEvent) => {
      updateTaskFromSocket(event.detail);
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      removeTaskFromSocket(event.detail.id);
    };

    const handleCommentAdded = (event: CustomEvent) => {
      addCommentFromSocket(event.detail);
    };

    const handleProjectUpdated = (_event: CustomEvent) => {
      // Refresh projects when one is updated
      fetchProjects();
    };

    // Add event listeners
    window.addEventListener('socket:task_created', handleTaskCreated as EventListener);
    window.addEventListener('socket:task_updated', handleTaskUpdated as EventListener);
    window.addEventListener('socket:task_deleted', handleTaskDeleted as EventListener);
    window.addEventListener('socket:comment_added', handleCommentAdded as EventListener);
    window.addEventListener('socket:project_updated', handleProjectUpdated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('socket:task_created', handleTaskCreated as EventListener);
      window.removeEventListener('socket:task_updated', handleTaskUpdated as EventListener);
      window.removeEventListener('socket:task_deleted', handleTaskDeleted as EventListener);
      window.removeEventListener('socket:comment_added', handleCommentAdded as EventListener);
      window.removeEventListener('socket:project_updated', handleProjectUpdated as EventListener);
    };
  }, [socket, addTaskFromSocket, updateTaskFromSocket, removeTaskFromSocket, addCommentFromSocket, fetchProjects]);

  return { socket, isConnected };
};