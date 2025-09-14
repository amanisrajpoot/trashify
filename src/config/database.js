const knex = require('knex');
const config = require('../../knexfile');

const db = knex(config[process.env.NODE_ENV || 'development']);

async function connectDatabase() {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

module.exports = {
  db,
  connectDatabase
};
