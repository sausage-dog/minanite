import { OddsOn } from './OddsOn';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Poseidon,
} from 'snarkyjs';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts;
}

async function localDeploy(
  zkAppInstance: OddsOn,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey,
  challenger: PublicKey,
  challengee: PublicKey,
  spread: Field
) {
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.init(spread, challenger, challengee);
    zkAppInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
}

describe('OddsOn', () => {
  let numbChallengee: Field;
  let hashChallengee: Field;
  let numbChallenger: Field;
  let hashChallenger: Field;
  let zkAppInstance: OddsOn;
  let spread: Field;

  let accounts;
  let zkAppAddress: PublicKey;
  let zkAppPrivateKey: PrivateKey;
  let deployerAccount: PrivateKey;
  let challenger: PrivateKey;
  let challengee: PrivateKey;

  beforeAll(async () => {
    await isReady;

    // All numbers below are 10 when unmasked
    // 10:         000000000000000000000000000001010
    // 3579173642: 011010101010101011101101100001010
    // 8410955786: 111110101010101010000000000001010
    numbChallengee = new Field(3579173642);
    numbChallenger = new Field(8410955786);
    hashChallengee = Poseidon.hash([numbChallengee]);
    hashChallenger = Poseidon.hash([numbChallenger]);
    spread = new Field(66);
    accounts = createLocalBlockchain();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    deployerAccount = accounts[0].privateKey;
    challengee = accounts[1].privateKey;
    challenger = accounts[2].privateKey;
  });

  afterAll(async () => {
    setTimeout(shutdown, 0);
  });

  it('init', async () => {
    zkAppInstance = new OddsOn(zkAppAddress);
    await OddsOn.compile();
    await localDeploy(
      zkAppInstance,
      zkAppPrivateKey,
      deployerAccount,
      challenger.toPublicKey(),
      challengee.toPublicKey(),
      spread
    );
  });

  it('Submit commits', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.submitHash(hashChallenger, challenger);
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn.send().wait();
    const txn2 = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.submitHash(hashChallengee, challengee);
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn2.send().wait();

    // TODO: Add tests to verify state
  });

  it('Submit reveal', async () => {
    const txn2 = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.submitReveal(numbChallengee, challengee);
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn2.send().wait();
    console.log(
      '\n\nSecond Invocation\n************************************************************\n\n'
    );
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.submitReveal(numbChallenger, challenger);
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn.send().wait();

    // TODO: Add tests to verify state
  });

  it('Set winner', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.setChallangeStatus();
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn.send().wait();
    const txn2 = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.setChallangeStatus();
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn2.send().wait();

    // TODO:  Add tests to verify state
  });
});