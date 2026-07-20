import { mongoClient } from './db.js'

export async function updateRtcDevice(rtcDeviceId: string, insObject: any) {
      const mClient = mongoClient;
      const database = mClient.db('global');
      const collection = database.collection<any>('rtcDevices');
      insObject.modified = new Date();
      const query = await collection.updateOne({'_id': rtcDeviceId}, {$set: insObject });
      return query;
}
