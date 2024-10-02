const dotenv = require('dotenv');
const { prisma } = require('../../prisma/prisma');
dotenv.config();

async function fetchDataFromDB(client) {
  try {
    const existingEntries = await prisma.infringment.findMany({
      where: {
        clientName: client.trim(),
        infringementStatus: 'Submitted for removal'
      },
      select: {
        link: true,
        id:true
      }
    });
    console.log(`Total url count: - ${existingEntries.length}`);
    return existingEntries;
  } catch (error) {
    console.log('error: ', error);
  }
}

module.exports = fetchDataFromDB;