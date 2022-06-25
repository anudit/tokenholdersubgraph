# tokenholdersubgraph
A subgraph to index insights into token holders - Mainnet.


## Ethereum
Build completed: QmeSjDLPLkNh1aKnfLJgcPzQ2A2dfBBpNYeR3SF1QwjLY4

Deployed to https://thegraph.com/studio/subgraph/tokenholders

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/1649/tokenholders/v1.8

## Matic
Build completed: QmSXUTtBqBfCGk7urwq4LRBnEGxEV5VsougCmmxFwLx434

Deployed to https://thegraph.com/explorer/subgraph/anudit/tokenholders

Subgraph endpoints:
Queries (HTTP):     https://api.thegraph.com/subgraphs/name/anudit/tokenholders

### Examples

Get a User's Balances
```gql
{
  users(where: {id: "0xd3e9d60e4e4de615124d5239219f32946d10151d"}) {
    id
    balances {
      balance
      holdingAtleast1Since
      holdingAtleast10000Since
    	tokenPointed{
        name
        decimals
      }
    }
  }
}
```

Get All Token Holders
```gql
{
  tokenBalances (where: {tokenPointed: "0x90275c752ff8e020cdeec4dec43318cf569fd445"}, orderBy: balance, orderDirection: desc, first: 1000) {
    userPointed{
      id
    }
    balance
    holdingAtleast1Since
    holdingAtleast10000Since
    tokenPointed{
      name
      decimals
    }
  }
}
```

Get All Tokens
```gql
{
  tokens (orderBy: birth, orderDirection: asc, first: 1000) {
    id
    name
    symbol
    totalSupply
    decimals
    birth
    transfers
  }
}
```
