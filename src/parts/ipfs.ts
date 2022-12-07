import OrbitDB from 'orbit-db';
import { create } from 'ipfs-http-client';
import { Bool, fetchLastBlock } from 'snarkyjs';
const IPFS = require('ipfs')
const ipfs = create();


export async function createOrbDB_key(_dbID: string) {
    let orbitdb = await OrbitDB.createInstance(ipfs);      
    // Create key-valuedatabase instance
    const db = await orbitdb.keyvalue(_dbID)
    await db.load();    
    return db;
}

export async function createOrbDB_log(_dbID: string) {
    let orbitdb = await OrbitDB.createInstance(ipfs);      
    // Create append database instance
    const db = await orbitdb.log(_dbID)
    await db.load();   
    return db; 
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
  