const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const key = process.env.BUILDING_API_KEY;

// Simulate frontend fetchBuildingLedger
async function fetchBuildingLedger(sigunguCd, bjdongCd, bun, ji) {
    const url = `http://localhost:3000/api/building-ledger?sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}`;
    console.log("Fetching local API:", url);
    const res = await fetch(url);
    const json = await res.json();
    console.log("Local API JSON:", JSON.stringify(json, null, 2));
}

// "서울 중구 태평로1가 84" -> bcode: 1114010300
// sigunguCd: 11140, bjdongCd: 10300, bun: 0084, ji: 0000
fetchBuildingLedger('11140', '10300', '0084', '0000');
