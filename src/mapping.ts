// import { BigInt } from "@graphprotocol/graph-ts"
import { Address, BigDecimal, BigInt, ByteArray, dataSource } from '@graphprotocol/graph-ts'
import { log } from '@graphprotocol/graph-ts'
import {
  ERC20Token,
  Transfer
} from "../generated/ERC20Token/ERC20Token"
import { Holder, Token, TokenBalance } from "../generated/schema"

function compare(amount: BigInt, base: BigInt, decimals: u8): boolean {
  return amount.toBigDecimal().gt(BigInt.fromI32(10).pow(decimals).times(base).toBigDecimal())
}

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
  const decimals = tokenContract.decimals() as u8;

  if (!entity) {
    entity = new TokenBalance(id);
    entity.holderPointed = holderAddress.toHexString();
    entity.balance = BigInt.fromI64(0);
    entity.over1since = BigInt.fromI64(0);
    entity.over10since = BigInt.fromI64(0);
    entity.over100since = BigInt.fromI64(0);
    entity.over1000since = BigInt.fromI64(0);
    entity.over10000since = BigInt.fromI64(0);
  }

  let newBalAmount = increase == true ? entity.balance.plus(amount) : entity.balance.minus(amount);

  entity.balance = newBalAmount;

  log.debug('log {}, {}, {}, {}, {}', [entity.balance.toString(), amount.toString(), increase.toString(), newBalAmount.toString(), BigInt.fromI64(10**decimals).toString()])
  // check if balance satifies the condition and timestamp has not been set before(so that we don't override the history.)
  if(compare(newBalAmount, BigInt.fromI32(1), decimals) && BigInt.fromI64(0).equals(entity.over1since) == true) {
    entity.over1since = now;
  }
  else{ // if balance fails condition, set 0
    entity.over1since = BigInt.fromI64(0)
  };

  if(compare(newBalAmount, BigInt.fromI32(10), decimals) && BigInt.fromI64(0).equals(entity.over10since) == true) {
    entity.over10since = now;
  }
  else{
    entity.over10since = BigInt.fromI64(0)
  };

  if(compare(newBalAmount, BigInt.fromI32(100), decimals) && BigInt.fromI64(0).equals(entity.over100since) == true) {
    entity.over100since = now;
  }
  else{
    entity.over100since = BigInt.fromI64(0)
  };

  if(compare(newBalAmount, BigInt.fromI32(1000), decimals) && BigInt.fromI64(0).equals(entity.over1000since) == true) {
    entity.over1000since = now;
  }
  else{
    entity.over1000since = BigInt.fromI64(0)
  };

  if(compare(newBalAmount, BigInt.fromI32(10000), decimals) && BigInt.fromI64(0).equals(entity.over10000since) == true) {
    entity.over10000since = now;
  }
  else{
    entity.over10000since = BigInt.fromI64(0)
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
