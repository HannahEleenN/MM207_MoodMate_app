import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
console.log(connectionString);
const pool = new Pool({
    connectionString,
});

try{
    await pool.query("Select * from users");
    console.log(`Successfully connected to the database at ${connectionString}`);
}catch(err){
    console.error("Database connection failed:", err);
    process.exit(1);
}


export default pool;