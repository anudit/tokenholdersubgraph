const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/1649/tokenholders/v1.11';
const GRAPH_ENPOINT_MATIC = 'https://api.thegraph.com/subgraphs/id/QmYbC6BuuBtWmAbQEDVpxqCvNoLFsbnzSzg4bkvAiP5ZsM';
let active_enpoint = GRAPH_ENDPOINT;
let active_network = 'ethereum';

async function getTokens() {
  const response = await fetch(active_enpoint, {
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

  let tokens = await response.json();

  document.getElementById('tokenCount').innerText = `${tokens.data.tokens.length} Tokens on ${active_network}`
  var x = document.getElementById("tokenInput");
  x.innerHTML = '';

  for (let index = 0; index < tokens.data.tokens.length; index++) {
    const token = tokens.data.tokens[index];
    var option = document.createElement("option");
    option.text = `${token.symbol} - ${token.name}`;
    option.value = token.id;
    x.add(option);

  }
}

async function gqlFetch(tokenAddress) {
    const response = await fetch(active_enpoint, {
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


async function getHistoryData(tokenAddress, userAddress) {
  const response = await fetch(active_enpoint, {
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
      query: `query GetData($tokenAddress: String, $userAddress: String){
        tokenBalanceSnapshots(where: {tokenPointed: $tokenAddress, userPointed: $userAddress}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          userPointed {
            id
          }
          balance
          timestamp
          tokenPointed {
            name
            decimals
          }
        }
      }
      `,
      variables: {"tokenAddress": tokenAddress.toLowerCase(), "userAddress": userAddress.toLowerCase()}
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
  if (active_network === 'ethereum') window.open(`https://etherscan.io/token/${add}`, target='_blank')
  if (active_network === 'matic') window.open(`https://polygonscan.com/token/${add}`, target='_blank')
}

async function updateNetwork(){
  active_network = document.getElementById('networkInput').value;
  if (active_network === 'ethereum') {
    active_enpoint = GRAPH_ENDPOINT;
  }
  else if (active_network === 'matic') {
    active_enpoint = GRAPH_ENPOINT_MATIC;
  }
  await getTokens();

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


async function updatePlot(){

  let tokenAddress = document.getElementById('tokenInput').value;
  let userAddress = document.getElementById('balanceHistoryUserInput').value;

  let {data: {tokenBalanceSnapshots: historyData}} = await getHistoryData(tokenAddress, userAddress);

  if (historyData.length > 0){

    document.getElementById('userBalanceHistoryPlot').innerHTML = '';

    var data = [
      {
        x: historyData.map(e=>{
          return new Date(parseInt(e.timestamp)*1000).toISOString();
        }),
        y: historyData.map(e=>{
          let pbal = ethers.BigNumber.from(e.balance);
          return parseFloat(pbal.div(ethers.BigNumber.from('10').pow(e.tokenPointed.decimals)).toString());
        }),
        type: 'scatter'
      }
    ];

    Plotly.newPlot('userBalanceHistoryPlot', data);

  }
  else {
    document.getElementById('userBalanceHistoryPlot').innerHTML = 'No history';
  }

}

window.addEventListener('load', async () => {
  let tokens = await getTokens();
});
