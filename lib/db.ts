import { MongoClient, type Collection, type Db } from 'mongodb'

const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient; databasePromise?: Promise<Db> }

export function getDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) return Promise.reject(new Error('MONGODB_URI is not configured'))
  globalForMongo.databasePromise ??= (globalForMongo.mongoClient ??= new MongoClient(uri)).connect().then((client) => client.db(process.env.MONGODB_DB || 'global_estates'))
  return globalForMongo.databasePromise
}

export async function propertiesCollection(): Promise<Collection> {
  const db = await getDatabase()
  const collection = db.collection('properties')
  await collection.createIndex({ status: 1, createdAt: -1 })
  await collection.createIndex({ category: 1, country: 1, location: 1 })
  await collection.createIndex({ price: 1 })
  return collection
}
