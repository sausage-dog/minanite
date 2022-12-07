import {
  State,
  state,
  Bool,
  SmartContract,
  Mina,
  method,
  DeployArgs,
  UInt64,
  Permissions,
  Poseidon,
  Circuit,
  PublicKey,
  PrivateKey,
  Scalar,
  AccountUpdate,
  Token,
  VerificationKey,
  Field,
  Experimental,
  Int64,
} from 'snarkyjs';

import { createOrbDB_key, createOrbDB_log } from './ipfs';
const propReference = require('./files/proposalReference.json');
const propVotes = require('./files/proposalReference.json');
const user = require('./files/proposalReference.json');

export class Main extends SmartContract {
  // submissions + time
  @state(PublicKey as any) admin = State<PublicKey>();
  @state(Field) proposals = State<Field>();
  @state(Field) propositions_counter = State<Field>();
  @state(Field) v_ID = State<Field>();

  // TODO add admin field

  @method init(callerPrivKey: PrivateKey) {
    super.init();
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proof(),
      receive: Permissions.proof(),
    });

    // Sets the admin
    this.admin.set(callerPrivKey.toPublicKey());
  }

  @method async initMe(
    adminPrivKey: PrivateKey,
    adminSecretPrivKey: PrivateKey,
    proposals: Field,
    v_ID: Field
  ) {
    // Sets the admin
    this.admin.set(adminPrivKey.toPublicKey());

    // Sets file that holds all the links
    this.proposals.set(proposals);

    // Set unique ID
    this.v_ID.set(v_ID);

    // Create database instance for permitted users
    let orbit_ID_wl = '/orbitdb/' + v_ID.toString() + '/wl';
    const db_inst_wl = await createOrbDB_key(orbit_ID_wl);

    let u = user;
    u['canPropose'] = 1;
    u['canVote'] = 1;

    // Add admin to it with hash of private key as key
    await db_inst_wl.put(
      Poseidon.hash(adminSecretPrivKey.toFields()).toString(),
      u
    );
  }

  @method async appendWhitelist(
    adminPrivKey: PrivateKey,
    hashPrivKey: Field,
    canProp: number,
    canVote: number
  ) {
    // Check admin call
    let admin = this.admin.get();
    this.admin.assertEquals(admin);
    let callerAddress = adminPrivKey.toPublicKey();
    admin.assertEquals(callerAddress);

    // Get ID
    let id = this.v_ID.get();
    this.v_ID.assertEquals(id);

    // Permissions below 2
    new Field(canProp).assertLte(new Field(1));
    new Field(canVote).assertLte(new Field(1));

    // New user struct
    let u = user;
    u['canPropose'] = canProp;
    u['canVote'] = canVote;

    // Create orbitDB handle for wl
    let orbit_ID_wl = '/orbitdb/' + id.toString() + '/wl';

    // Add database instance for proposal, with hash of private key as key
    const db_inst_wl = await createOrbDB_key(orbit_ID_wl);
    await db_inst_wl.put(Poseidon.hash(hashPrivKey.toFields()).toString(), u);
  }

  // Test setting field 1 to true
  @method async addProposal(callerPrivKey: PrivateKey, proposal_text: string) {
    // Get this instance ID
    let id = this.v_ID.get();
    this.v_ID.assertEquals(id);

    // Get otbit db handle
    let orbit_ID_wl = '/orbitdb/' + id.toString() + '/wl';
    const db_inst_wl = await createOrbDB_log(orbit_ID_wl);

    // Rehash private key to get odb key
    let odb_key = Poseidon.hash(callerPrivKey.toFields()).toString();

    // Asssert user can propose
    const userDeets = db_inst_wl.get(odb_key);
    let permPost = new Field(userDeets['canPropose']);
    permPost.assertEquals(new Field(1));

    // Get prop counter
    let prop_count = this.propositions_counter.get();
    this.propositions_counter.assertEquals(prop_count);

    // Create orbit DB instance based on the recent counter
    let orbit_ID_prop =
      '/orbitdb/' + id.toString() + '/' + prop_count.toString();
    const db_inst_prop = await createOrbDB_key(orbit_ID_prop);

    // Write instance of proposal vote struct to the db instance
    let v = propVotes;
    v['proposalText'] = proposal_text;
    db_inst_prop.put('prop', v);

    // Update prop submission counter
    prop_count = prop_count.add(new Field(1));
    this.propositions_counter.set(prop_count);
  }

  // Add one in the 3 subs counter
  @method async voteProposal(
    callerPrivKey: PrivateKey,
    vote: number,
    voteIdx: number
  ) {
    // Get this instance ID
    let id = this.v_ID.get();
    this.v_ID.assertEquals(id);

    // Get robit db handle for whitelist
    let orbit_ID_wl = '/orbitdb/' + id.toString() + '/wl';
    const db_inst_wl = await createOrbDB_log(orbit_ID_wl);

    // Rehash private key to get odb key
    let odb_key = Poseidon.hash(callerPrivKey.toFields()).toString();

    // Asssert user can propose
    const userDeets = db_inst_wl.get(odb_key);
    let permPost = new Field(userDeets['canVote']);
    permPost.assertEquals(new Field(1));

    // Get orbit db hanlde for the proposal
    let orbit_ID_prop = '/orbitdb/' + id.toString() + '/' + voteIdx.toString();
    const db_inst_prop = await createOrbDB_key(orbit_ID_prop);

    // Vote, 0 => Nay, 1 => Yay
    let prop = db_inst_prop.get('prop');
    // Circuit.if(vote == 0,)
    if (vote == 0) {
      prop['votes']['nay'] += 1;
    } else {
      prop['votes']['yay'] += 1;
    }

    // Write back prop
    db_inst_prop.put('prop', prop);
  }
}
