const fs = require('fs');
const path = require('path');
const db = require('./database');

const sqlFile = path.join(__dirname, 'update_database.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('Error updating database:', err);
  } else {
    console.log('Database updated successfully');
  }
}); 