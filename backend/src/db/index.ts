import mongoose from "mongoose"
import logger from "../config/logger.js";

const connectDB = async (): Promise<void> => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        logger.info(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        logger.error(`MongoDB connection error ${error}`)
        process.exit(1)
    }
}

export default connectDB