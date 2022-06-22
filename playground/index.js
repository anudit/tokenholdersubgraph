async function gqlFetch(tokenAddress) {
    const response = await fetch('https://api.studio.thegraph.com/query/1649/tokenholders/v1.3', {
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
              transfers
            }
          }`,
        variables: {"tokenAddress": tokenAddress.toLowerCase()}
      })
    });
    return response.json(); // parses JSON response into native JavaScript objects
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


async function fetchData(){
    let data = document.getElementById('tokenInput');
    let resp = await gqlFetch(data.value);

    let tokenData = resp.data.token;

    let strength = [];

    for (let index = 0; index < resp.data.tokenBalances.length; index++) {
        let { balance, userPointed, holdingAtleast1Since } = resp.data.tokenBalances[index];
        let decimals = parseInt(tokenData.decimals);
        let parsedBal = formatBal(balance, decimals);
        // strength[userPointed.id] = {
        //     bal: parsedBal,
        //     sqrtBal: parsedBal**0.5,
        //     daysSince: timeSince(parseInt(holdingAtleast1Since)),
        //     strength: ((parsedBal)**0.5) * timeSince(parseInt(holdingAtleast1Since))
        // }

        strength.push(((parsedBal)**0.5) * timeSince(parseInt(holdingAtleast1Since)));
    }

    document.getElementById('output').innerHTML += `${data.options[data.selectedIndex].innerText} :: Avg Strength: ${sum(strength)/strength.length} <br/>`;

    console.log(strength);
}