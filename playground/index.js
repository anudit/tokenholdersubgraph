const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/1649/tokenholders/v1.7';

async function getTokens() {
  const response = await fetch(GRAPH_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({
      query: `{
        tokens (orderBy: birth, orderDirection: asc, first: 1000) {
          id
          name
          symbol
          totalSupply
          decimals
          birth
          transfers
          paused
        }
      }`,
      variables: {}
    })
  });
  return response.json();
}

async function gqlFetch(tokenAddress) {
    const response = await fetch(GRAPH_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({
        query: `query GetData($tokenAddress: String){
            tokenBalances (where: {tokenPointed: $tokenAddress, balance_gt: 0}, orderBy: balance, orderDirection: desc, first: 1000) {
              userPointed{
                id
              }
              balance
              holdingAtleast1Since
              holdingAtleast10000Since
            }
            token(id: $tokenAddress) {
              id
              name
              symbol
              totalSupply
              decimals
              birth
              paused
            }
          }`,
        variables: {"tokenAddress": tokenAddress.toLowerCase()}
      })
    });
    return response.json();
}

function timeSince(time){
    let now = Date.now()
    var delta = Math.abs((time*1000) - now) / 1000;
    let days = Math.floor(delta / 86400);
    return days;
}

function formatBal(bal, decimals){
    return parseInt(bal)/(10**decimals)
}

function sum(array){
    let s = 0;
    for (let index = 0; index < array.length; index++) {
        s += array[index];
    }
    return s;
}

function avg(array){
  return sum(array)/array.length;
}

function openInEtherscan(){
  let add = document.getElementById('tokenInput').value;
  window.open(`https://etherscan.io/token/${add}`, target=undefined)
}

async function fetchData(e){

  e.innerText = 'Fetching...';
  e.disabled = true;

    let data = document.getElementById('tokenInput');
    let resp = await gqlFetch(data.value);

    let tokenData = resp.data.token;

    let strength = [];

    for (let index = 0; index < resp.data.tokenBalances.length; index++) {
        let { balance, holdingAtleast1Since } = resp.data.tokenBalances[index];
        let decimals = parseInt(tokenData.decimals);
        let parsedBal = formatBal(balance, decimals);
        let parsedTotalSupply = formatBal(tokenData.totalSupply, decimals);
        // strength[userPointed.id] = {
        //     bal: parsedBal,
        //     sqrtBal: parsedBal**0.5,
        //     daysSince: timeSince(parseInt(holdingAtleast1Since)),
        //     strength: ((parsedBal)**0.5) * timeSince(parseInt(holdingAtleast1Since))
        // }

        let calculatedStrength = (parsedBal/parsedTotalSupply*100) * timeSince(parseInt(holdingAtleast1Since));
        if(tokenData.paused === true){
          calculatedStrength = calculatedStrength*0;
        }
        strength.push(calculatedStrength);
    }

    let priceData = await fetch(`https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/1/USD/${data.value}/?quote-currency=USD&format=JSON&key=ckey_b469893fc4c9418893d32a8720d`).then(r=>r.json());

    document.getElementById('output').innerHTML += `${data.options[data.selectedIndex].innerText} :: Avg Strength: ${avg(strength).toLocaleString()}, Holders: ${resp.data.tokenBalances.length.toLocaleString()}, Price: $${priceData.data[0].items[0].price} <br/>`;

    console.log(strength);

    e.innerText = 'Fetch Data';
    e.disabled = false;
}

window.addEventListener('load', async () => {
  let tokens = await getTokens();
  document.getElementById('tokenCount').innerText = `${tokens.data.tokens.length} Tokens on Ethereum Mainnet`
  var x = document.getElementById("tokenInput");


  for (let index = 0; index < tokens.data.tokens.length; index++) {
    const token = tokens.data.tokens[index];
    var option = document.createElement("option");
    option.text = `${token.symbol} - ${token.name}`;
    option.value = token.id;
    x.add(option);

  }

});
