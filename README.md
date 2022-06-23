# tokenholdersubgraph
A subgraph to index insights into token holders - Mainnet.

Build completed: QmXw42i51xSZFgX5imKsZjPgeqoPEAe6cphACeHuDuL661

Deployed to https://thegraph.com/studio/subgraph/tokenholders

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/1649/tokenholders/v1

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
  tokens {
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
