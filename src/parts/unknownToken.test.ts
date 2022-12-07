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
  UInt64,
} from 'snarkyjs';
import { unknownToken } from './unknownToken';
let feePayerKey: PrivateKey;
let tokenZkappKey: PrivateKey;
let tokenZkappAddress: PublicKey;
let tokenZkapp: unknownToken;
let tokenId: Field;
async function setup() {
  await isReady;
  await unknownToken.compile();
  let Local = Mina.LocalBlockchain({ proofsEnabled: false });
  Mina.setActiveInstance(Local);
  feePayerKey = Local.testAccounts[0].privateKey;

  tokenZkappKey = PrivateKey.random();
  tokenZkappAddress = tokenZkappKey.toPublicKey();

  tokenZkapp = new unknownToken(tokenZkappAddress);
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


    test('marks vote', async () => {      

      // No votes and no submissions
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(0));

      const tx = await Mina.transaction(feePayerKey, () => {
        tokenZkapp.mark_vote(new Field(2));        
      });
      await tx.prove();
      tx.sign([feePayerKey]);
      await tx.send();      

      // Assert voted on proposal at index 10
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(64));      

      let t = false;
      // Can't vote for the same index
      try{
        const tx2 = await Mina.transaction(feePayerKey, () => {
          tokenZkapp.mark_vote(new Field(2));        
        });
        await tx2.prove();
        tx2.sign([feePayerKey]);
        await tx2.send();      
        expect(false);
        t = true;
      }
      catch{
        expect(true);
      }      
      expect(t).toEqual(false);

      // Assert vote record unchanged
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(64));
    });

    test('mark submission', async () => {      

      // Assert counter initiliased to zero
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(0));

      // Increment submission counter to 1 / 1
      let tx = await Mina.transaction(feePayerKey, () => {
        tokenZkapp.mark_submission();        
      });
      await tx.prove();
      tx.sign([feePayerKey]);
      await tx.send();      

      // Assert counter incremented to 1
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(2));

      // Increment submission counter to 2 / 3
      tx = await Mina.transaction(feePayerKey, () => {
        tokenZkapp.mark_submission();        
      });
      await tx.prove();
      tx.sign([feePayerKey]);
      await tx.send();      

      // Assert counter incremented to 2 / 3
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(6));

      // Increment submission counter to 3 / 7
      tx = await Mina.transaction(feePayerKey, () => {
        tokenZkapp.mark_submission();        
      });
      await tx.prove();
      tx.sign([feePayerKey]);
      await tx.send();      

      // Assert counter incremented to 3 / 7
      expect(tokenZkapp.unknown_field.get()).toEqual(Field(14));
    })
  });
});
