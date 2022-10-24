/* eslint-disable */

import { Minanite } from './Minanite';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
} from 'snarkyjs';

async function localDeploy(
  zkAppInstance: Minanite,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey,
  admin: PublicKey
) {
  
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.init(admin);
    zkAppInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
  console.log("END LOCAL DEPLOPY\n\n")
}


function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts;
}

describe('Minanite', () => {
  let accounts: any;
  let admin: PrivateKey;
  let deployerAccount: PrivateKey;
  let zkAppAddress: PublicKey;
  let zkAppPrivateKey: PrivateKey;
  let zkAppInstance: any;

  beforeAll(async () => {
    await isReady;
    accounts = createLocalBlockchain();

    console.log('accounts', accounts);
    deployerAccount = accounts[0].privateKey;
    admin = accounts[1].privateKey;    
    
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    console.log('THAT PUB KEY WORKS\n', admin);
  });

  beforeEach(async () => {    
    zkAppInstance = new Minanite(zkAppAddress);    
    console.log("Pub keyt of admin: ",admin.toPublicKey().toBase58() ); 
    await localDeploy(
      zkAppInstance,
      zkAppPrivateKey,
      deployerAccount,
      admin.toPublicKey() //as PublicKey
    );
    console.log("SHIT"); 
  });



  it('generates and deploys the `Minanite` smart contract', async () => {
    const zkAppInstance = new Minanite(zkAppAddress);

    const num = zkAppInstance.num.get();
    // expect(num).toEqual(Field.one);
  });

  // it('correctly updates the num state on the `Add` smart contract', async () => {
  //   // const zkAppInstance = new Minanite(zkAppAddress);
  //   // await localDeploy(
  //   //   zkAppInstance,
  //   //   zkAppPrivateKey,
  //   //   deployerAccount,
  //   //   admin.toPublicKey()
  //   // );
  //   const txn = await Mina.transaction(deployerAccount, () => {
  //     zkAppInstance.update();
  //     zkAppInstance.sign(zkAppPrivateKey);
  //   });
  //   await txn.send().wait();

  //   const updatedNum = zkAppInstance.num.get();
  //   // expect(updatedNum).toEqual(Field(3));
  // });

  afterAll(async () => {    
    setTimeout(shutdown, 0);
  });
});


/* eslint-disable */