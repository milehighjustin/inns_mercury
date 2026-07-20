import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://<user>:<password>@cluster.mongodb.net/'

export const mongoClient = new MongoClient(MONGO_URI, {
  maxPoolSize: 20,          // Cap connections to respect Atlas limits
  minPoolSize: 5,           // Keep connections hot for fast API/Socket responses
  maxIdleTimeMS: 30000,     // Clean up idle connections automatically
})

// Trigger the async connection pool initialization immediately on application startup
mongoClient.connect()
  .then(() => console.log('MongoDB Global Connection Pool Ready'))
  .catch(err => console.error('Failed to init global pool:', err))
