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
  // - (4-end) 1-1 mapping for submissions wrt to voting
  
  export class knownToken extends SmartContract {
  
    // Total number of bits = 8*248 ( but not used for this)    
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
  
      // Sets it to zero as it is the known account
      this.known_field.set(new Field(1))           
    }
  
    // Function to add a new known token account
    @method set_new(perms: Field, hash: Field) {

        // Arrays
        let perms_arr = perms.toBits();  
        let known_field_arr = (new Field(1)).toBits();
        let hash_arr = hash.toBits();

        // Loop load permissions
        for (let i = 1; i < 3; i++) known_field_arr[i] = perms_arr[i-1];

        // Loop load hash
        for (let i = 3; i < 252; i++) known_field_arr[i] = hash_arr[i-3];        

        // Write state
        this.known_field.set(Field.fromBits(known_field_arr))       
    }


    @method change_perm(new_perms: Field) {

        // Load existing state
        let known_field = this.known_field.get();
        this.known_field.assertEquals(known_field);

        // Arrays
        let new_perms_arr = new_perms.toBits();  
        let known_field_arr = known_field.toBits();
        
        // Update
        known_field_arr[1] = new_perms_arr[0];
        known_field_arr[2] = new_perms_arr[1];
        known_field_arr[3] = new_perms_arr[2];

        // Write state
        this.known_field.set(Field.fromBits(known_field_arr));
    } 
  }
  