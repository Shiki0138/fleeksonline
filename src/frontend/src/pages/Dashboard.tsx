import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Folder as ProjectIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  link: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const stats: StatCard[] = [
    {
      title: 'Total Projects',
      value: projects?.length || 0,
      icon: <ProjectIcon />,
      color: '#1976d2',
      link: '/projects',
    },
    {
      title: 'Active Tasks',
      value: tasks?.filter(t => t.status !== 'completed').length || 0,
      icon: <TaskIcon />,
      color: '#ed6c02',
      link: '/tasks',
    },
    {
      title: 'Completed Tasks',
      value: tasks?.filter(t => t.status === 'completed').length || 0,
      icon: <TrendingUpIcon />,
      color: '#2e7d32',
      link: '/tasks?status=completed',
    },
    {
      title: 'Team Members',
      value: projects ? new Set(projects.flatMap(p => p.members?.map(m => m.userId) || [])).size : 0,
      icon: <PeopleIcon />,
      color: '#9c27b0',
      link: '/team',
    },
  ];

  const recentProjects = projects?.slice(0, 5) || [];
  const recentTasks = tasks?.slice(0, 5) || [];

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'review':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getProjectProgress = (project: any) => {
    if (project.tasksCount === 0) return 0;
    return (project.completedTasksCount / project.tasksCount) * 100;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's what's happening with your projects and tasks today.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                height: '100%',
              }}
              onClick={() => navigate(stat.link)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recent Projects
              </Typography>
              <Button size="small" onClick={() => navigate('/projects')}>
                View All
              </Button>
            </Box>

            {recentProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No projects yet. Create your first project to get started.
              </Typography>
            ) : (
              <List>
                {recentProjects.map((project) => (
                  <ListItem
                    key={project.id}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <ProjectIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={project.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {project.description.substring(0, 60)}...
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={getProjectProgress(project)}
                              sx={{ flexGrow: 1, mr: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">
                              {Math.round(getProjectProgress(project))}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recent Tasks
              </Typography>
              <Button size="small" onClick={() => navigate('/tasks')}>
                View All
              </Button>
            </Box>

            {recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks yet. Create your first task to get started.
              </Typography>
            ) : (
              <List>
                {recentTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <TaskIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip
                            label={task.status.replace('_', ' ')}
                            size="small"
                            color={getTaskStatusColor(task.status) as any}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {task.project.name}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};