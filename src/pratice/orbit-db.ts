//code from flexergy

import OrbitDB from 'orbit-db';
import { create } from 'ipfs-http-client';
import { Bool } from 'snarkyjs';
const ipfs = create();

async function startLogging(_privKey: string, _serviceWindowID: number) {
  //identity provider not working since using typescript
  // let identity = new IdentityProvider({
  // id: _privKey, //that should be eth address mapped to serial number of the meter
  // })
  // let orbitdb = await OrbitDB.createInstance(ipfs, { identity: identity });
  let orbitdb = await OrbitDB.createInstance(ipfs);

  const db = await orbitdb.log(_serviceWindowID.toString());
  await db.load();
  appendToLog(db);
  return db.address.toString();
}

async function appendToLog(db: any) {
  const solarData = [
    1, 0, 0, 0, 0, 7, 31, 182, 393, 638, 694, 746, 742, 692, 578, 458, 320, 141,
    55, 5, 0, 0, 0, 2,
  ];
  for (let i = 0; i < solarData.length; i++) {
    await db.add(solarData[i]);
    await sleep(1000);
    console.log('data added');
  }
}

async function returnData(
  _privKey: string,
  _serviceWindowID: number
): Promise<[number, string]> {
  let orbitdb = await OrbitDB.createInstance(ipfs);
  const db = await orbitdb.log(_serviceWindowID.toString());
  await db.load();
  let total = 0;
  let collection = db.iterator({ limit: -1 }).collect();
  for (let entry in collection) {
    let t = collection[entry].payload.value;
    if (typeof t === 'number') total += t;
  }

  return [total, JSON.stringify(collection, null, 2)];
}
function parseAddress(address: string): [Bool, any] {
  const isInstanceOf = OrbitDB.isValidAddress(address);
  return [Bool(isInstanceOf), address];

  // setu
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { startLogging, returnData, parseAddress };

// @method async startStream(
//     privKey: Field,
//     serviceWindowId: Field,
//     deliveryMinimum: Field
//   ) {
//     let state = this.isStreaming.get();
//     state.equals(false).assertEquals(true);
//     const providedPrivKeyHash = Poseidon.hash([privKey]);
//     let hash = this.zkMeterPrivKeyHash.get();
//     hash.equals(providedPrivKeyHash).assertEquals(true);

//     let addr = await startLogging(
//       privKey.toString(),
//       parseInt(serviceWindowId.toString())
//     );
//     this.locationAddressHash.set(Poseidon.hash([Field(addr)]));
//     this.isStreaming.set(Bool(true));
//     this.minimumToDeliver.set(deliveryMinimum);
//   }

//   @method async confirmDelivery(
//     privKey: Field,
//     locationAddress: Field,
//     serviceWindowId: Field,
//     dataHash: Field
//   ) {
//     let state = this.isStreaming.get();
//     state.equals(true).assertEquals(true);
//     const providedPrivKeyHash = Poseidon.hash([privKey]);
//     let hash = this.zkMeterPrivKeyHash.get();
//     hash.equals(providedPrivKeyHash).assertEquals(true);
//     let locationHash = this.locationAddressHash.get();
//     let stateLogHash = Poseidon.hash([locationAddress]);
//     locationHash.equals(stateLogHash).assertEquals(true);
//     let address = '/orbitdb/' + locationAddress + '/' + serviceWindowId;
//     const [isValid, ipfsLocation] = parseAddress(address);
//     isValid.assertEquals(true);
//     let [total, data] = await returnData(privKey.toString(), ipfsLocation);
//     let pulledDataHash = Poseidon.hash([Field(data)]);
//     dataHash.equals(pulledDataHash).assertEquals(true);
//     let stateMinimum = this.minimumToDeliver.get();
//     Field(total).assertGte(stateMinimum);
//     this.isStreaming.set(Bool(false));
//   }