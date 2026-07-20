import { mongoClient } from './db.js'

export async function getAllRtcDevices() {
      const mClient = mongoClient;
      const database = mClient.db('global');
      const collection = database.collection<any>('rtcDevices');
      const query = await collection.find({active: true}).toArray();
      return query;
}
