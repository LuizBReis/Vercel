const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSuggestedSkills = async () => {
  const skills = await prisma.skill.findMany({
    where: {
      isSuggested: true,
    },
    orderBy: {
      name: 'asc', // Retorna as skills em ordem alfabética
    },
  });
  return skills;
};

module.exports = {
  getSuggestedSkills,
};