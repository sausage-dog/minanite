
//     @method runQuery(query: Query, data: FullData) {
//       // check if it is the same data as user uploaded
//       // let commitedHash = this.dataHash.get();
//       // commitedHash.assertEquals(Poseidon.hash([data]));\
//       let singleRange = query.value.length;
//       let idx = Field.zero;
//       let isFullSequence = Bool(false);
//       for (let i = 0; i < data.value.length - 2; i++) {
//         console.log('run number : ', i);
//         console.log('sequence match', parseInt(idx.toString()) * 5, '%');
//         isFullSequence = Circuit.if(
//           Field(singleRange).equals(idx),
//           Bool(true),
//           isFullSequence
//         );
//         idx = Circuit.if(idx.gte(Field(singleRange)), Field.zero, idx);
//         let dataBit1 = data.value[i];
//         let queryBit1 = query.value[parseInt(idx.toString())];
//         let dataBit2 = data.value[i + 1];
//         let queryBit2 = query.value[parseInt(idx.add(1).toString())];
//         let result1 = dataBit1.equals(queryBit1);
//         let result2 = dataBit2.equals(queryBit2);
//         let result = Circuit.if(
//           result1.equals(Bool(true)).and(result2.equals(Bool(true))),
//           Bool(true),
//           Bool(false)
//         );
//         idx = Circuit.if(result, idx.add(2), Field.zero);
//         i++;
//       }
//       isFullSequence.assertEquals(true);
//     }
//   }
  