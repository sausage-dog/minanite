import {
  shutdown,
  isReady,
  Mina,
  PrivateKey,
  PublicKey,
  Field,
  AccountUpdate,
  Token,
  // Int64,
  UInt64,
  // Circuit,
  Signature,
} from 'snarkyjs';
import { Tokenite } from './Tokenite';
let feePayerKey: PrivateKey;
let tokenZkappKey: PrivateKey;
let tokenZkappAddress: PublicKey;
let tokenZkapp: Tokenite;
let tokenId: Field;
let newToken: Token;
// let testAccounts: {
//   publicKey: PublicKey;
//   privateKey: PrivateKey;
// }[];
// let someAccount: {
//   publicKey: PublicKey;
//   privateKey: PrivateKey;
// };
let aliceKey: PrivateKey;
let aliceAddr: PublicKey;
let bobKey: PrivateKey;
let bobAddr: PublicKey;
let totalSupply: UInt64;
let verificationKey: any;
const proofsEnabled = true;
async function setup() {
  await isReady;
  let Local = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  feePayerKey = Local.testAccounts[0].privateKey;
  aliceKey = PrivateKey.random();
  aliceAddr = aliceKey.toPublicKey();
  bobKey = PrivateKey.random();
  bobAddr = bobKey.toPublicKey();

  tokenZkappKey = PrivateKey.random();
  tokenZkappAddress = tokenZkappKey.toPublicKey();
  console.table([
    ['zkApp: ' + tokenZkappAddress.toBase58()],
    ['alice: ' + aliceAddr.toBase58()],
    ['bob: ' + bobAddr.toBase58()],
  ]);

  if (proofsEnabled) {
    ({ verificationKey } = await Tokenite.compile());
  }
  tokenZkapp = new Tokenite(tokenZkappAddress);
  tokenId = tokenZkapp.token.id;
  console.log('main: ', tokenId.toBigInt());
  totalSupply = UInt64.from(10n ** 18n);
}

describe('Token', () => {
  Error.stackTraceLimit = 10000;
  afterAll(() => setTimeout(shutdown, 0));

  describe('init', () => {
    beforeAll(async () => {
      await setup();
    });

    test('should deploy', async () => {
      let tx = await Mina.transaction(feePayerKey, () => {
        AccountUpdate.fundNewAccount(feePayerKey);
        // let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
        // feePayerUpdate.balance.subInPlace(Mina.accountCreationFee());
        // feePayerUpdate.send({
        //   to: tokenZkappAddress,
        //   amount: Mina.accountCreationFee().mul(2),
        // });
        tokenZkapp.deploy({ verificationKey, zkappKey: tokenZkappKey });
        // tokenZkapp.requireSignature();
      });
      await tx.prove();
      tx.sign([feePayerKey, tokenZkappKey]);
      await tx.send();
    });
    test('should init', async () => {
      let tx = await Mina.transaction(feePayerKey, () => {
        // let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
        // feePayerUpdate.balance.subInPlace(Mina.accountCreationFee());
        // feePayerUpdate.send({
        //   to: tokenZkappAddress,
        //   amount: Mina.accountCreationFee().mul(2),
        // });
        tokenZkapp.init();
        // tokenZkapp.requireSignature();
      });
      await tx.prove();
      tx.sign([tokenZkappKey, feePayerKey]);
      await tx.send();
    });
    test('create a valid token with a different parentTokenId', async () => {
      newToken = new Token({
        tokenOwner: tokenZkappAddress,
        parentTokenId: tokenId,
      });
      expect(newToken.id).toBeDefined();
      expect(newToken.id).not.toEqual(tokenId);

      console.log('new: ', newToken.id.toBigInt());
    });
    test('correct token id can be derived with an existing token owner', () => {
      expect(tokenId).toEqual(Token.getId(tokenZkappAddress));
    });

    test('mints correct starting balance', async () => {
      const mintAmount = totalSupply;
      const mintSignature = Signature.create(
        tokenZkappKey,
        mintAmount.toFields().concat(tokenZkappAddress.toFields())
      );

      const mint_txn = await Mina.transaction(feePayerKey, () => {
        AccountUpdate.fundNewAccount(feePayerKey);
        // let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
        // feePayerUpdate.balance.subInPlace(Mina.accountCreationFee());
        // feePayerUpdate.send({
        //   to: tokenZkappAddress,
        //   amount: Mina.accountCreationFee(),
        // });
        tokenZkapp.mint(tokenZkappAddress, mintAmount, mintSignature);
      });

      await mint_txn.prove();
      mint_txn.sign([tokenZkappKey]);
      await mint_txn.send();

      console.log(
        tokenZkapp.totalAmountInCirculation.get() +
          ' ' +
          Mina.getAccount(tokenZkappAddress).tokenSymbol
      );
      let accountUpdate = AccountUpdate.create(tokenZkappAddress, tokenId);
      let balance = accountUpdate.account.balance.get();
      console.log('balance is:', balance.toBigInt());
      expect(balance).toEqual(totalSupply);
    });
    test('transfer works ', async () => {
      let tx = await Mina.transaction(feePayerKey, () => {
        AccountUpdate.fundNewAccount(feePayerKey);
        tokenZkapp.transfer(tokenZkappAddress, aliceAddr, totalSupply.div(200));
        // tokenZkapp.transfer(tokenZkappAddress, bobAddr, totalSupply.div(200));
        // tokenZkapp.requireSignature();
      });

      await tx.prove();
      tx.sign([tokenZkappKey]);
      await tx.send();
      // console.log(tx.toJSON());
      // let tx1 = await Mina.transaction(feePayerKey, () => {
      //   AccountUpdate.fundNewAccount(feePayerKey);
      //   // tokenZkapp.transfer(tokenZkappAddress, aliceAddr, totalSupply.div(200));
      //   tokenZkapp.transfer(tokenZkappAddress, bobAddr, totalSupply.div(200));
      //   // tokenZkapp.requireSignature();
      // });

      // await tx1.prove();
      // tx1.sign([tokenZkappKey]);
      // await tx1.send();
    });
    test('reflects correct balance after the transfer', () => {
      let tokenAcc = AccountUpdate.create(tokenZkappAddress, tokenId);
      let appBalance = tokenAcc.account.balance.get();
      console.log('app Balance is:', appBalance.toBigInt());

      let userBalance = Mina.getBalance(aliceAddr, tokenZkapp.token.id);
      console.log('Alice token Balance is:', userBalance.value.toBigInt());

      expect(userBalance).toEqual(totalSupply.div(200));
      expect(appBalance).toEqual(totalSupply.sub(totalSupply.div(200)));
    });
    test('check Value at 0, 1', async () => {
      let tx0 = await Mina.transaction(feePayerKey, () => {
        AccountUpdate.fundNewAccount(
          feePayerKey
          //   {
          //   initialBalance: Mina.accountCreationFee().mul(5),
          // }
        );
        let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
        feePayerUpdate.send({
          to: aliceAddr,
          amount: 4000000000,
        });
      });
      await tx0.prove();
      tx0.sign([tokenZkappKey, feePayerKey]);
      await tx0.send();
      let update = AccountUpdate.create(aliceAddr, tokenId);
      let appState = update.body.update.appState;
      console.log('value[0]:', appState[0].value.toBigInt());
      console.log('isSome[0]?', appState[0].isSome.toBoolean());
      console.log('value[1]:', appState[1].value.toBigInt());

      console.log(
        'alice:',
        Mina.getAccount(aliceAddr, tokenId).appState![0].toBigInt()
      );
    });
    test('set Value at 1', async () => {
      // console.log('alice:', Mina.getAccount(aliceAddr).balance.toBigInt());
      // console.log('bob:', Mina.getAccount(bobAddr).balance.toBigInt());
      // let topTxn = await Mina.transaction(feePayerKey, () => {
      // let feePayerUpdate = AccountUpdate.createSigned(feePayerKey);
      // feePayerUpdate.balance.subInPlace(Mina.accountCreationFee().mul(2));
      // feePayerUpdate.send({
      //   to: aliceAddr,
      //   amount: 10000000000,
      // });
      // AccountUpdate.create(aliceAddr).balance.addInPlace(
      //   Mina.accountCreationFee().mul(2)
      // );
      // });
      // await topTxn.prove();
      // topTxn.sign([feePayerKey, aliceKey]);
      // await topTxn.send();
      let tx = await Mina.transaction(feePayerKey, () => {
        // let update = AccountUpdate.create(aliceAddr, tokenId);
        // let firstState = update.body.update.appState[0];
        // AccountUpdate.setValue(firstState, Field(6969));
        // AccountUpdate.attachToTransaction(tokenZkapp.self);
        // AccountUpdate.attachToTransaction();
        // let approveSendingCallback = Experimental.Callback.create(
        //   zkAppB,
        //   'approveSend',
        //   [amount]
        // );
        tokenZkapp.setStateForUser(aliceKey, Field(6969), tokenId);
        // tokenZkapp.sign(aliceKey);
      });
      await tx.prove();
      tx = tx.sign([aliceKey, tokenZkappKey, feePayerKey]);
      console.log(tx.toPretty());
      await tx.send();
      // console.log(tx.toJSON());
      // let update = AccountUpdate.create(aliceAddr, tokenId);
      // let appState = update.body.update.appState;
      // console.log('new value[0]:', appState[0].value.toBigInt());
      // console.log('new value[1]:', appState[1].value.toBigInt());
      console.log(
        'new value appstate: ',
        Mina.getAccount(aliceAddr, tokenId).appState![0].toBigInt()
      );
    });
  });
});
// function balanceSum(accountUpdate: AccountUpdate, tokenId: Field) {
//   let myTokenId = accountUpdate.body.tokenId;
//   let myBalance = Int64.fromObject(accountUpdate.body.balanceChange);
//   let balance = Circuit.if(myTokenId.equals(tokenId), myBalance, Int64.zero);
//   for (let child of accountUpdate.children.accountUpdates) {
//     balance = balance.add(balanceSum(child, tokenId));
//   }
//   return balance;
// }
