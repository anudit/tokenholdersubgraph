# tokenholdersubgraph
A subgraph to index insights into token holders - Mainnet.

Build completed: QmW3UXcuYBvBHdgwxCrXFzzspMmHwBuHUo84DAAX8q69ty

Deployed to https://thegraph.com/explorer/subgraph/anudit/tokenholders

Subgraph endpoints:
Queries (HTTP):     https://api.thegraph.com/subgraphs/name/anudit/tokenholders
Subscriptions (WS): wss://api.thegraph.com/subgraphs/name/anudit/tokenholders


### Examples

```gql
{
  tokens(first:1000){
    totalSupply
    id
    symbol
    decimals
    name
  }
  tokenBalances(first:1000){
    id
    holderPointed {
      id
    }
    balance
    over1since
    over10since
    over100since
    over1000since
    over10000since
  }
  holders(first:1000){
    id
    balances {
      id
      balance
    }
  }
}

```


```gql
{
  tokens(first:1000){
    totalSupply
    id
    symbol
    decimals
    name
  }
  tokenBalances(first:10, where: {balance_gt:"10000000000000000000"}){
    id
    holderPointed {
      id
    }
    tokenPointed {
      name
    }
    balance
    over1since
    over10since
    over100since
    over1000since
    over10000since
  }
}
```
