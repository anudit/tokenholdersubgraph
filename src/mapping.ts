// import { BigInt } from "@graphprotocol/graph-ts"
import { Address, BigInt, dataSource } from '@graphprotocol/graph-ts'
// import { log } from '@graphprotocol/graph-ts'
import {
  ERC20Token,
  Transfer
} from "../generated/ERC20Token/ERC20Token"
import { Holder, Token, TokenBalance } from "../generated/schema"


function updateTokenData(address: Address): void {

  let id = address.toHexString().concat('-').concat(dataSource.network());
  let entity = Token.load(id);

  if (!entity){
    entity = new Token(id);
    let tokenContract = ERC20Token.bind(address);
    entity.name = tokenContract.name();
    entity.symbol = tokenContract.symbol();
    entity.decimals = BigInt.fromI32(tokenContract.decimals());
    entity.totalSupply = tokenContract.totalSupply();
  }

  entity.save();
}

function updateHolderBalance(tokenAddress: Address, holderAddress: Address, amount: BigInt, increase: bool, now: BigInt): void {

  let id = holderAddress.toHexString().concat('-').concat(tokenAddress.toHexString()).concat('-').concat(dataSource.network());
  let entity = TokenBalance.load(id);
  let tokenContract = ERC20Token.bind(tokenAddress);
  const decimals = tokenContract.decimals();

  if (!entity) {
    entity = new TokenBalance(id);
    entity.holderPointed = holderAddress.toHexString();
    entity.balance = BigInt.fromI32(0);
    entity.over1since = BigInt.fromI32(0);
    entity.over10since = BigInt.fromI32(0);
    entity.over100since = BigInt.fromI32(0);
    entity.over1000since = BigInt.fromI32(0);
    entity.over10000since = BigInt.fromI32(0);
  }

  let newBalAmount = increase == true ? entity.balance.plus(amount) : entity.balance.minus(amount);
  entity.balance = newBalAmount;

  if(entity.over1since == BigInt.fromI32(0) && newBalAmount >= BigInt.fromI32(1*(10**decimals))) {
    entity.over1since = now;
  }
  else{
    entity.over1since = BigInt.fromI32(0)
  };

  if(entity.over10since == BigInt.fromI32(0) && newBalAmount >= BigInt.fromI32(10*(10**decimals))) {
    entity.over10since = now;
  }
  else{
    entity.over10since = BigInt.fromI32(0)
  };

  if(entity.over100since == BigInt.fromI32(0) && newBalAmount >= BigInt.fromI32(100*(10**decimals))) {
    entity.over100since = now;
  }
  else{
    entity.over100since = BigInt.fromI32(0)
  };

  if(entity.over1000since == BigInt.fromI32(0) && newBalAmount >= BigInt.fromI32(1000*(10**decimals))) {
    entity.over1000since = now;
  }
  else{
    entity.over1000since = BigInt.fromI32(0)
  };

  if(entity.over10000since == BigInt.fromI32(0) && newBalAmount >= BigInt.fromI32(10000*(10**decimals))) {
    entity.over10000since = now;
  }
  else{
    entity.over10000since = BigInt.fromI32(0)
  };

  entity.save();
}

export function handleTransfer(event: Transfer): void {

  updateTokenData(event.address);

  let entity = Holder.load(event.params.to.toHexString());

  if (!entity){
    entity = new Holder(event.params.to.toHexString());
  }

  entity.save();

  updateHolderBalance(event.address, event.params.to, event.params.value, true, event.block.timestamp);

  if(event.params.from != Address.zero()){
    updateHolderBalance(event.address, event.params.from, event.params.value, false, event.block.timestamp);
  }
}



// export function handleTransfer(event: Transfer): void {


//   // // =================================================
//   // // update the From Side
//   // // =================================================


//   // log.info('msg {}, {}', [event.params.from.toHexString(), event.params.to.toHexString()])

//   // if (event.params.from.toHexString() !== "0x0000000000000000000000000000000000000000"){
//   //   let fromEntity = Holder.load(event.params.from.toHexString());

//   //   // from entity shouldn't be null because
//   //   // - from is not a zero address (checked Above)
//   //   // - the user would've gotten the tokens from somewhere and that's when the to side would've updated the entity so no need to do it again.

//   //   if (fromEntity){

//   //     let balanceId = event.address.toHexString().concat("-").concat(dataSource.network());

//   //     let balanceIdFound = fromEntity.balances.includes(balanceId);

//   //     if (balanceIdFound === true){ // the user already holds that token. (should be the default case as you can't transfer a token you don't hold unless transferFrom)
//   //       let balanceObj = TokenBalance.load(fromEntity.balances[fromEntity.balances.indexOf(balanceId)]);

//   //       if (balanceObj != null){
//   //         let newBalAmount = balanceObj.balance.minus(event.params.value);
//   //         if(newBalAmount < BigInt.fromI32(1*(10**18))) balanceObj.over1since = BigInt.fromI64(0);
//   //         if(newBalAmount < BigInt.fromI32(10*(10**18))) balanceObj.over10since = BigInt.fromI64(0);
//   //         if(newBalAmount < BigInt.fromI32(100*(10**18))) balanceObj.over100since = BigInt.fromI64(0);
//   //         if(newBalAmount < BigInt.fromI32(1000*(10**18))) balanceObj.over1000since = BigInt.fromI64(0);
//   //         if(newBalAmount < BigInt.fromI32(10000*(10**18))) balanceObj.over10000since = BigInt.fromI64(0);

//   //         balanceObj.save();
//   //       }

//   //     }
//   //     else {
//   //       // the user does not hold that token.
//   //     }

//   //     fromEntity.save();

//   //   }

//   // }




//   // =================================================
//   // Update the To Side.
//   // =================================================

//   let entity = Holder.load(event.params.to.toHexString());

//   if (!entity){
//     entity = new Holder(event.params.to.toHexString());
//   }

//   let newBalanceId = event.address.toHexString().concat("-").concat(dataSource.network());
//   log.info('newBalanceId {}', [newBalanceId]);

//   let balanceIdFound = entity.balances.includes(newBalanceId);

//   log.info('msg2 {}, {}', [newBalanceId, balanceIdFound.toString()]);

//   // let now = event.block.timestamp

//   // if (balanceIdFound === true){ // the user already holds that token.
//   //   let balanceObj = TokenBalance.load(entity.balances[entity.balances.indexOf(newBalanceId)]);

//   //   if (balanceObj != null){
//   //     let newBalAmount = balanceObj.balance.plus(event.params.value);
//   //     if(newBalAmount < BigInt.fromI32(1*(10**18))) balanceObj.over1since = BigInt.fromI64(0);
//   //     if(newBalAmount < BigInt.fromI32(10*(10**18))) balanceObj.over10since = BigInt.fromI64(0);
//   //     if(newBalAmount < BigInt.fromI32(100*(10**18))) balanceObj.over100since = BigInt.fromI64(0);
//   //     if(newBalAmount < BigInt.fromI32(1000*(10**18))) balanceObj.over1000since = BigInt.fromI64(0);
//   //     if(newBalAmount < BigInt.fromI32(10000*(10**18))) balanceObj.over10000since = BigInt.fromI64(0);

//   //     balanceObj.save();
//   //   }


//   // }
//   // else { // the user does not hold that token.
//   //   let balance = new TokenBalance(newBalanceId);

//   //   balance.balance = event.params.value;
//   //   balance.holderPointed = event.address.toHexString();
//   //   if(event.params.value > BigInt.fromI32(1*(10**18))) {
//   //     balance.over1since = now
//   //   }
//   //   else {
//   //     balance.over1since = BigInt.fromI32(0);
//   //   };
//   //   if(event.params.value > BigInt.fromI32(10*(10**18))) {
//   //     balance.over10since = now
//   //   }
//   //   else {
//   //     balance.over10since = BigInt.fromI32(0);
//   //   };
//   //   if(event.params.value > BigInt.fromI32(100*(10**18))) {
//   //     balance.over100since = now
//   //   }
//   //   else {
//   //     balance.over100since = BigInt.fromI32(0);
//   //   };
//   //   if(event.params.value > BigInt.fromI32(1000*(10**18))) {
//   //     balance.over1000since = now
//   //   }
//   //   else {
//   //     balance.over1000since = BigInt.fromI32(0);
//   //   };
//   //   if(event.params.value > BigInt.fromI32(10000*(10**18))) {
//   //     balance.over10000since = now
//   //   }
//   //   else {
//   //     balance.over10000since = BigInt.fromI32(0);
//   //   };

//   //   balance.save();
//   // }

//   entity.save();
// }
