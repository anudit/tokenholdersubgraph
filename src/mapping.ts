import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
  ERC20Token,
  RoleGranted,
  Transfer
} from "../generated/ERC20Token/ERC20Token"
import { User, Token, TokenBalance, Role, TokenBalanceSnapshot } from "../generated/schema"

const ZERO = BigInt.fromI32(0);

function compareGe(amount: BigInt, decimals: u8, compareWith: BigInt): boolean {
  let base = BigInt.fromI32(10).pow(decimals);
  let formattedTokenAmount = amount.div(base);
  return formattedTokenAmount.ge(compareWith);
}

function updateTokenData(address: Address, now: BigInt): void {

  let id = address.toHexString();
  let entity = Token.load(id);
  let tokenContract = ERC20Token.bind(address);

  if (!entity){
    entity = new Token(id);
    entity.name = tokenContract.name();
    entity.symbol = tokenContract.symbol();
    entity.decimals = BigInt.fromI32(tokenContract.decimals());
    entity.totalSupply = tokenContract.totalSupply();
    entity.transfers = BigInt.fromI32(0);
    entity.birth = now;
    entity.paused = false;
  }

  let isPaused = tokenContract.try_paused();
  if (!isPaused.reverted){
    entity.paused = isPaused.value;
  }
  entity.transfers = entity.transfers.plus(BigInt.fromI32(1));
  entity.save();
}

function updateUserBalance(tokenAddress: Address, userAddress: Address, amount: BigInt, increase: bool, now: BigInt, txnhash: Bytes): void {

  let id = userAddress.toHexString().concat('-').concat(tokenAddress.toHexString());
  let entity = TokenBalance.load(id);
  let tokenContract = ERC20Token.bind(tokenAddress);
  const decimals = tokenContract.decimals() as u8;

  if (!entity) {
    entity = new TokenBalance(id);
    entity.userPointed = userAddress.toHexString();
    entity.tokenPointed = tokenAddress.toHexString();
    entity.balance = ZERO;
    entity.holdingAtleast1Since = ZERO;
    entity.holdingAtleast10Since = ZERO;
    entity.holdingAtleast100Since = ZERO;
    entity.holdingAtleast1000Since = ZERO;
    entity.holdingAtleast10000Since = ZERO;

  }


  let newBalAmount = increase == true ? entity.balance.plus(amount) : entity.balance.minus(amount);

  entity.balance = newBalAmount;
  snapshotCurrentBalance(userAddress, tokenAddress, newBalAmount, now, txnhash);

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(1)) && entity.holdingAtleast1Since === ZERO) entity.holdingAtleast1Since = now;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(1)) === false) entity.holdingAtleast1Since = ZERO;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(10)) && entity.holdingAtleast10Since === ZERO) entity.holdingAtleast10Since = now;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(10)) === false) entity.holdingAtleast10Since = ZERO;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(100)) && entity.holdingAtleast100Since === ZERO) entity.holdingAtleast100Since = now;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(100)) === false) entity.holdingAtleast100Since = ZERO;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(1000)) && entity.holdingAtleast1000Since === ZERO) entity.holdingAtleast1000Since = now;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(1000)) === false) entity.holdingAtleast1000Since = ZERO;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(10000)) && entity.holdingAtleast10000Since === ZERO) entity.holdingAtleast10000Since = now;

  if (compareGe(newBalAmount, decimals, BigInt.fromI32(10000)) === false) entity.holdingAtleast10000Since = ZERO;

  entity.save();
}

export function handleTransfer(event: Transfer): void {

  updateTokenData(event.address, event.block.timestamp);

  let entity = User.load(event.params.to.toHexString());

  if (!entity){
    entity = new User(event.params.to.toHexString());
    entity.save();
  }

  if(event.params.to != Address.zero()){
    updateUserBalance(
      event.address,
      event.params.to,
      event.params.value,
      true,
      event.block.timestamp,
      event.transaction.hash
    );
  }

  if(event.params.from != Address.zero()){
    updateUserBalance(
      event.address,
      event.params.from,
      event.params.value,
      false,
      event.block.timestamp,
      event.transaction.hash
    );
  }
}

export function handleGrantRole(event: RoleGranted): void {

  let roleId = event.transaction.hash.toHexString().concat('-').concat(event.params.account.toHexString());
  let roleEntity = new Role(roleId);
  roleEntity.tokenPointed = event.address.toHexString();
  roleEntity.roleHolder = event.params.account.toHexString();
  roleEntity.roleType = event.params.role;
  roleEntity.save();

}


function snapshotCurrentBalance(user: Address, token: Address, balance: BigInt, timestamp: BigInt, txnHash: Bytes): void {

  let snapId = token.toHexString().concat('-').concat(user.toHexString()).concat('-').concat(timestamp.toString());
  let snapEntity = new TokenBalanceSnapshot(snapId);

  snapEntity.userPointed = user.toHexString();
  snapEntity.tokenPointed = token.toHexString();
  snapEntity.balance = balance;
  snapEntity.timestamp = timestamp;
  snapEntity.txnHash = txnHash.toHexString();

  snapEntity.save();

}
