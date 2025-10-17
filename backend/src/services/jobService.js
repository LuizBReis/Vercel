const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllJobs = async (filters) => {
  const { search, minBudget, maxBudget } = filters;
  const whereClause = {};
  if (search) {
    whereClause.title = { contains: search, mode: 'insensitive' };
  }
  if (minBudget) {
    whereClause.budget = { ...whereClause.budget, gte: parseFloat(minBudget) };
  }
  if (maxBudget) {
    whereClause.budget = { ...whereClause.budget, lte: parseFloat(maxBudget) };
  }
  const jobs = await prisma.job.findMany({
    where: whereClause,
    include: {
      author: { // author (ClientProfile)
        select: {
          id: true,
          companyName: true, // Pega o nome da empresa
          user: { select: { firstName: true, lastName: true } } // Pega o nome como fallback
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return jobs;
};


const createJob = async (jobData, clientProfileId) => {
  const { title, description, budget } = jobData;
  return prisma.job.create({
    data: {
      title,
      description,
      budget,
      author: { connect: { id: clientProfileId } },
    },
  });
};

const getJobById = async (jobId, currentUserId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      author: {
        select: {
          id: true,
          companyName: true,
          user: { select: { id: true, firstName: true, lastName: true } }
        }
      }
    }
  });
  if (!job) return null;
  if (currentUserId) {
    const application = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: jobId,
          applicantId: currentUserId,
        },
      },
    });
    job.hasApplied = !!application;
  }
  return job;
};

const applyForJob = async (jobId, applicantId) => {
  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_applicantId: { jobId, applicantId },
    },
  });
  if (existingApplication) {
    throw new Error('Você já se candidatou para esta vaga.');
  }
  return prisma.jobApplication.create({
    data: { jobId, applicantId },
  });
};

const updateJob = async (jobId, clientProfileId, jobData) => {
  return prisma.job.updateMany({
    where: {
      id: jobId,
      authorId: clientProfileId, // A segurança agora checa o ID do ClientProfile
    },
    data: jobData,
  });
};

const deleteJob = async (jobId, clientProfileId) => {
  return prisma.job.deleteMany({
    where: {
      id: jobId,
      authorId: clientProfileId, // A segurança agora checa o ID do ClientProfile
    },
  });
};

const getApplicantsForJob = async (jobId, clientProfileId, filters = {}) => {
  const job = await prisma.job.findFirst({
    where: { id: jobId, authorId: clientProfileId },
  });
  if (!job) {
    throw new Error('Acesso negado.');
  }
  const { skill } = filters;
  const whereClause = { jobId };
  if (skill) {
    whereClause.applicant = {
      freelancerProfile: { // A relação 'skills' agora está em FreelancerProfile
        skills: { some: { name: { contains: skill, mode: 'insensitive' } } },
      },
    };
  }
  return prisma.jobApplication.findMany({
    where: whereClause,
    include: {
      applicant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          freelancerProfile: { select: { description: true, skills: { select: { name: true } } } },
        },
      },
    },
  });
};

module.exports = {
  getAllJobs,
  createJob,
  getJobById,
  applyForJob,
  updateJob,
  deleteJob,
  getApplicantsForJob,
};