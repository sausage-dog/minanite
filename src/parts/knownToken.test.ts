
import assert from 'node:assert';
import {
  shutdown,
  isReady,
  Mina,
  PrivateKey,
  PublicKey,
  Field,
  AccountUpdate,
  Token,
  Int64,
  Poseidon,
  UInt64,
} from 'snarkyjs';
import { knownToken } from './knownToken';
let feePayerKey: PrivateKey;
let tokenZkappKey: PrivateKey;
let tokenZkappAddress: PublicKey;
let tokenZkapp: knownToken;
let tokenId: Field;
async function setup() {
  await isReady;
  await knownToken.compile();
  let Local = Mina.LocalBlockchain({ proofsEnabled: false });
  Mina.setActiveInstance(Local);
  feePayerKey = Local.testAccounts[0].privateKey;

  tokenZkappKey = PrivateKey.random();
  tokenZkappAddress = tokenZkappKey.toPublicKey();

  tokenZkapp = new knownToken(tokenZkappAddress);
  tokenId = tokenZkapp.token.id;
  console.log(tokenId);
}


describe('Token Bits', () => {
  afterAll(() => setTimeout(shutdown, 0));

  describe('init', () => {

    beforeEach(async () => {
      await setup();

      let tx = await Mina.transaction(feePayerKey, () => {
        AccountUpdate.fundNewAccount(feePayerKey);
        // let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
        // feePayerUpdate.balance.subInPlace(Mina.accountCreationFee());
        // feePayerUpdate.send({
        //   to: tokenZkappAddress,
        //   amount: Mina.accountCreationFee(),
        // });
        tokenZkapp.init();
        // tokenZkapp.init()
        tokenZkapp.requireSignature()
      });
      await tx.prove();
      tx.sign([tokenZkappKey, feePayerKey]);
      await tx.send();
    });
    

    test('Add new account', async () => {      

      // No votes and no submissions      

      // hash priv key
      let hashed_key = Poseidon.hash([new Field(33)]);

      console.log("hashed_key: ",hashed_key.toBigInt());

      // All perms with marker
      let all_perms = new Field(15);

      const tx = await Mina.transaction(feePayerKey, () => {
        tokenZkapp.set_new(all_perms, hashed_key);        
      });
      await tx.prove();
      tx.sign([feePayerKey]);
      await tx.send();      

      // Assert voted on proposal at index 10
    //   expect(tokenZkapp.unknown_field.get()).toEqual(Field(512));

      console.log("tokenZkapp.known_field: ",tokenZkapp.known_field.get().toBigInt());
      
    });

    // test('Modify existing account', async () => {      

    //  })
  });
});
