import { existsSync } from 'node:fs';
import mongoose from 'mongoose';

if (existsSync('.env')) {
    process.loadEnvFile();
}

const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST } = process.env;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST) {
    throw new Error('MONGODB_USER, MONGODB_PASSWORD and MONGODB_HOST must be set');
}

export const PORT = process.env.PORT || 8888;

const mongoUri = `mongodb+srv://${encodeURIComponent(MONGODB_USER)}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}/`;

connectToMongoDB();

async function connectToMongoDB() {
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
        console.log('You successfully connected to MongoDB!');
        return mongoose;
    } catch (err) {
        console.error('MongoDB connection failed');
        console.dir(err);
    }
}

async function disconnectFromMongoDB() {
    await mongoose.connection.close();
}
