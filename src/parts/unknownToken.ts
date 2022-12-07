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

// Bits of unknown account:
// - (1) token account type
// - (2) can vote
// - (3) can propose
// -  (4-36) hash of the priv key


// Bits of the unknown account:
// - (1) token account type
// - (2-4) daily submissions
// - (5-end) 1-1 mapping for submissions wrt to voting


export class unknownToken extends SmartContract {

  // Total number of bits = 8*248 ( but not used for this)
  @state(Field) unknown_field = State<Field>();   
  @state(Field) known_field = State<Field>();   

  // TODO add admin field

  @method init() {    
    super.init();
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proof(),
      receive: Permissions.proof(),
    });

    // Sets it to zero as it is the unknown account
    this.unknown_field.set(new Field(0))           
  }
  
  // Test setting field 1 to true
  @method mark_vote(idx_field: Field) {

    // Read current state
    let f1_state = this.unknown_field.get();
    this.unknown_field.assertEquals(f1_state);    

    // Convert number to array
    let marked: Bool[]  = f1_state.toBits();       
    
    // Mark provided index
    for (let i = 4; i < 248; i++) {
      let compare = Circuit.if(
        idx_field.equals(new Field(i-4)), // skip first four
        marked[i], // Assert not used     
        new Bool(false) // Don't care
      );

      // Not voted for this proposal
      compare.assertEquals(new Bool(false));
      
      marked[i] = Circuit.if(
        idx_field.equals(new Field(i-4)),
        new Bool(true), // Set to true
        marked[i] // Leave as is
      );
    }    
        
    // Convert from bool arr to field    
    let idx2 = Field.fromBits(marked);

    Circuit.log("start num: ", f1_state);
    Circuit.log("marked num: ", idx2);          
    Circuit.log("marked: ", marked);    

    this.unknown_field.set(idx2);
  }

  // Add one in the 3 subs counter
  @method mark_submission() {
    
    // Read current state
    let f1_state = this.unknown_field.get();
    this.unknown_field.assertEquals(f1_state);    

    // Convert number to array
    let submitted: Bool[] = f1_state.toBits().slice(1,4);      

    // Assert smaller than 7
    let submissions = Field.fromBits(submitted);
    submissions.assertLte(7)
    
    // Loop break flag    
    let found_idx = new Bool(false);       
    for (let i = 0; i < 3; i++) {

      // Copy for setting outside loop flag
      let sub_prior = submitted[i];

      // Check if it is false and if increment has already been made
      submitted[i] = Circuit.if(
        submitted[i].equals(new Bool(false)).and(found_idx.equals(new Bool(false))),
        new Bool(true),
        submitted[i])        

      // If this value was false, set the flag so the next loop doesn't flip bit for counter
      found_idx = Circuit.if(
        sub_prior.equals(new Bool(false)),
        new Bool(true),
        found_idx)              
    }      

    // let new_submitted = Field.fromBits(submitted);
    // Circuit.log("submitted new: ", new_submitted);

    // Put those back into total bool array
    let new_field_arr: Bool[] = f1_state.toBits();
    new_field_arr[1] = submitted[0];
    new_field_arr[2] = submitted[1];
    new_field_arr[3] = submitted[2];  
    
    // Store
    this.unknown_field.set(Field.fromBits(new_field_arr));

    Circuit.log("submitted Setting: ", Field.fromBits(new_field_arr));
  }
}
