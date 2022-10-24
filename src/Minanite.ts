/* eslint-disable */

import {
  Field,
  SmartContract,
  state,
  State,
  PublicKey,
  Signature,
  method,
  DeployArgs,
  Permissions,
  PrivateKey,
} from 'snarkyjs';


export class Minanite extends SmartContract {
  @state(Field) num = State<Field>();
  @state(PublicKey)  admin = State<PublicKey>();
  @state(Field) merkleWhiteList: State<Field>;

  // Admin that adds people to the whitelist

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method init(admin: PublicKey) {    
    this.admin.set(admin);
  }


  // Admin swap
  @method async setNewAdmin(
    admin: PrivateKey,
    member: PublicKey,        
  ) {

  }

  // Admin adds members
  @method async addWhitelistedCTA(
    admin: PrivateKey,
    member: PublicKey,        
  ) {

    // verify caller

    // mint custom token account

    // set bool in data payload to true


  }

  // Admin removes members
  @method async removeWhitelistedCTA(
    admin: PrivateKey,
    member: PublicKey,        
  ) {

    // verify caller

    // set bool in data payload to false

  }
  

  @method async propose(    
    member: PrivateKey,        
  ) {

  }


  @method async vote(    
    member: PrivateKey,        
  ) {

  }
}


/* eslint-disable */