import mongoose from 'mongoose';
export const PORT = process.env.PORT || 8888;
connectToMongoDB();
async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://applivery:applivery@applivercluster.yqpvtl0.mongodb.net/');
        console.log('You successfully connected to MongoDB!');
        return mongoose;
    } catch (err) {
        console.dir(err);
    }
}
// Call this only when your application terminates
async function disconnectFromMongoDB() {
    await mongoose.connection.close();
}
