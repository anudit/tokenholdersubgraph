const fetch = require('cross-fetch');
var allTokens = require('./tokens.json');
const fs = require('fs');

async function getOriginBlock(contractAddress){
	let url = `https://api.polygonscan.com/api?module=account&action=txlistinternal&address=${contractAddress}&startblock=0&endblock=latest&page=0&offset=0&sort=asc&apikey=ZU4PIWRH1C1VDPVMIBW3R5EV1KA8GJANVY`;
	let json = await fetch(url).then(r=>r.json());
	if (json.result.length === 0) return 0;
	else return json.result[0].blockNumber;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let filteredTokens = allTokens.filter((e)=>{return e.network_chain_id == '137'});

async function getData(){

    for (var i =0; i < filteredTokens.length; i+=1 ){
        let bn = await getOriginBlock(filteredTokens[i].address);
        await sleep(100);
        console.log(i, filteredTokens.length, filteredTokens[i].address, bn);
        filteredTokens[i].blockNumber = bn;
    }

	let resp = filteredTokens.map(e=>{
		return `
	  - kind: ethereum
		name: ${e.name}-${e.symbol}
		network: matic
		source:
		  address: "${e.address}"
		  abi: ERC20Token
		  startBlock: ${e.blockNumber}
		mapping:
		  kind: ethereum/events
		  apiVersion: 0.0.5
		  language: wasm/assemblyscript
		  entities:
			- User
			- TokenBalance
			- Token
			- Role
		  abis:
			- name: ERC20Token
			  file: ./abis/ERC20Token.json
		  eventHandlers:
			- event: Transfer(indexed address,indexed address,uint256)
			  handler: handleTransfer
			- event: RoleGranted(indexed bytes32,indexed address,indexed address)
			  handler: handleGrantRole
		  file: ./src/mapping.ts
		`
	}).join('\n');

	fs.writeFile('Output.txt', resp, (err) => {
		if (err) throw err;
	})

}

getData();
