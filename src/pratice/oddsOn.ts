import {
    Field,
    SmartContract,
    state,
    State,
    Circuit,
    method,
    DeployArgs,
    Permissions,
    PrivateKey,
    Poseidon,
    Bool,
    PublicKey,
  } from 'snarkyjs';
  
  /**
   * Basic Example
   * See https://docs.minaprotocol.com/zkapps for more info.
   *
   * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
   * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
   *
   * This file is safe to delete and replace with your own contract.
   */
  export class OddsOn extends SmartContract {
    @state(Field) spread = State<Field>();
    @state(PublicKey as any) challenger = State<PublicKey>();
    @state(PublicKey as any) challengee = State<PublicKey>();
    @state(Field) numbChallanger = State<Field>();
    @state(Field) numbChallangee = State<Field>();
  
    deploy(args: DeployArgs) {
      super.deploy(args);
      this.setPermissions({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });
    }
  
    @method init(spread: Field, challenger: PublicKey, challengee: PublicKey) {
      spread.assertLte(new Field(100));
      this.spread.set(spread);
      this.challenger.set(challenger);
      this.challengee.set(challengee);
    }
  
    @method validate(hash: Field) {
      this.numbChallanger.set(hash);
    }
  
    @method submitHash(hash: Field, callerPrivKey: PrivateKey) {
      // Load and reassert state
      let challenger = this.challenger.get();
      this.challenger.assertEquals(challenger);
      let challengee = this.challengee.get();
      this.challengee.assertEquals(challengee);
      let numbChallanger = this.numbChallanger.get();
      this.numbChallanger.assertEquals(numbChallanger);
      let numbChallangee = this.numbChallangee.get();
      this.numbChallangee.assertEquals(numbChallangee);
      let callerAddress = callerPrivKey.toPublicKey();
  
      let challengeeHash = Circuit.if(
        callerAddress.equals(challengee),
        hash,
        numbChallangee
      );
      let challengerHash = Circuit.if(
        callerAddress.equals(challenger),
        hash,
        numbChallanger
      );
  
      // Store
      this.numbChallangee.set(challengeeHash);
      this.numbChallanger.set(challengerHash);
    }
  
    @method submitReveal(reveal: Field, callerPrivKey: PrivateKey) {
      let challenger = this.challenger.get();
      this.challenger.assertEquals(challenger);
      let challengee = this.challengee.get();
      this.challengee.assertEquals(challengee);
      let numbChallanger = this.numbChallanger.get();
      this.numbChallanger.assertEquals(numbChallanger);
      let numbChallangee = this.numbChallangee.get();
      this.numbChallangee.assertEquals(numbChallangee);
      let callerAddress = callerPrivKey.toPublicKey();
  
      // Commits already made
      numbChallanger.equals(Field.zero).assertFalse();
      numbChallangee.equals(Field.zero).assertFalse();
  
      // Recalc hash
      let hash = Poseidon.hash([reveal]);
  
      // Unmask the number
      let revealBits: Bool[] = reveal.toBits();
      let filterd = new Array<Bool>(7);
      for (let i = 0; i < 7; i++) {
        filterd[i] = revealBits[i];
      }
  
      // Compare against stored hash
      let numbChallangeeNew = Circuit.if(
        hash.equals(numbChallangee).and(callerAddress.equals(challengee)),
        Field.ofBits(filterd),
        numbChallangee
      );
  
      let numbChallangerNew = Circuit.if(
        hash.equals(numbChallanger).and(callerAddress.equals(challenger)),
        Field.ofBits(filterd),
        numbChallanger
      );
  
      // Store
      this.numbChallangee.set(numbChallangeeNew);
      this.numbChallanger.set(numbChallangerNew);
    }
  
    @method setChallangeStatus() {
      let spread = this.spread.get();
      this.spread.assertEquals(spread);
      let numbChallanger = this.numbChallanger.get();
      this.numbChallanger.assertEquals(numbChallanger);
      let numbChallangee = this.numbChallangee.get();
      this.numbChallangee.assertEquals(numbChallangee);
  
      // D   F    RES
      // X   X  XXXXXXX
  
      // Get 7th bit on
      spread = spread.add(new Field(128));
  
      // Get 8th bit
      let add2 = Circuit.if(
        numbChallanger.equals(numbChallangee),
        new Field(256),
        Field.zero
      );
      spread = spread.add(add2);
      this.spread.set(spread);
    }
  }