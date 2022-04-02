# tokenholdersubgraph
A subgraph to index insights into token holders - Mainnet.

Build completed: QmdB86h4bVdqoU79bGLhspAfTFuCeJQeL97WLTacsa2oZq

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
