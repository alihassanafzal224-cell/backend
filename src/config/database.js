import mongoose from 'mongoose'


const connectDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\nDatabase connected successfully ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error('Database connection error:', error)
        process.exit(1)
    }
}
export default connectDatabase