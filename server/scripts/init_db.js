const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDB() {
    console.log('Initializing database using Mongoose...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB.');
        console.log('Mongoose handles schema creation automatically. No SQL scripts are needed.');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

initDB();
