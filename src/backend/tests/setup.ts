import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
  console.log('Test database disconnected');
});

beforeEach(async () => {
  // Clean up database before each test
  const deleteActivities = prisma.activityLog.deleteMany();
  const deleteComments = prisma.comment.deleteMany();
  const deleteAttachments = prisma.attachment.deleteMany();
  const deleteTaskLabels = prisma.taskLabel.deleteMany();
  const deleteLabels = prisma.label.deleteMany();
  const deleteTasks = prisma.task.deleteMany();
  const deleteProjectMembers = prisma.projectMember.deleteMany();
  const deleteProjects = prisma.project.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteActivities,
    deleteComments,
    deleteAttachments,
    deleteTaskLabels,
    deleteLabels,
    deleteTasks,
    deleteProjectMembers,
    deleteProjects,
    deleteUsers,
  ]);
});

export { prisma };