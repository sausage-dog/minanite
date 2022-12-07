import {
  Field,
  SmartContract,
  state,
  State,
  PublicKey,
  // Signature,
  method,
  DeployArgs,
  Permissions,
  // PrivateKey,
  UInt64,
  Bool,
  VerificationKey,
  Mina,
  AccountUpdate,
  // Experimental,
} from 'snarkyjs';

export class Minanite extends SmartContract {
  // SUPPLY = UInt64.from(100000000000000);
  // @state(UInt64) totalAmountInCirculation = State<UInt64>();
  // @state(Field) num = State<Field>();
  // @state(PublicKey) admin = State<PublicKey>();
  // @state(Field) merkleWhiteList: State<Field>;
  // // Admin that adds people to the whitelist
  // deploy(args: DeployArgs) {
  //   super.deploy(args);
  //   this.setPermissions({
  //     ...Permissions.default(),
  //     editState: Permissions.proofOrSignature(),
  //     send: Permissions.proofOrSignature(),
  //     receive: Permissions.proofOrSignature(),
  //   });
  // }
  // @method init(admin: PublicKey) {
  //   // super.init();
  //   this.admin.set(admin);
  //   let address = this.self.body.publicKey;
  //   let receiver = this.experimental.token.mint({
  //     address,
  //     amount: this.SUPPLY,
  //   });
  //   receiver.account.isNew.assertEquals(Bool(true));
  //   this.balance.subInPlace(Mina.accountCreationFee());
  //   this.totalAmountInCirculation.set(this.SUPPLY.sub(100_000_000));
  // }
  // @method deployZkapp(address: PublicKey, verifKey: VerificationKey) {
  //   let tokenId = this.experimental.token.id;
  //   let zkapp = AccountUpdate.defaultAccountUpdate(address, tokenId);
  //   this.experimental.token..approve(zkapp);
  //   AccountUpdate.setValue(zkapp.update.permissions, {
  //     ...Permissions.default(),
  //     send: Permissions.proof(),
  //   });
  //   AccountUpdate.setValue(zkapp.update.verificationKey, verifKey);
  //   zkapp.sign();
  // }
  // @method mint(receiverAddress: PublicKey, amount: UInt64) {
  //   let totalAmountInCirculation = this.totalAmountInCirculation.get();
  //   this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);
  //   let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);
  //   newTotalAmountInCirculation.value.assertLte(this.SUPPLY.value);
  //   this.experimental.token.mint({
  //     address: receiverAddress,
  //     amount,
  //   });
  //   this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  // }
  // // Admin swap
  // @method async setNewAdmin(admin: PrivateKey, member: PublicKey) {}
  // // Admin adds members
  // @method async addWhitelistedCTA(admin: PrivateKey, member: PublicKey) {
  //   // verify caller
  //   // mint custom token account
  //   // set bool in data payload to true
  // }
  // // Admin removes members
  // @method async removeWhitelistedCTA(admin: PrivateKey, member: PublicKey) {
  //   // verify caller
  //   // set bool in data payload to false
  // }
  // @method async propose(member: PrivateKey) {}
  // @method async vote(member: PrivateKey) {}
}
