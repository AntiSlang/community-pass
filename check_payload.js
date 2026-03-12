
// check_payload.js
const { Buffer } = require('buffer');

const base64Payload = "<ВСТАВЬ_BASE64_СЮДА>";
const buff = Buffer.from(base64Payload, 'base64');
console.log("bytes length:", buff.length);
console.log("hex:", buff.toString('hex').slice(0, 64));
console.log("first 4 bytes (uint32 BE): 0x" + buff.slice(0,4).toString('hex'));
console.log("first 4 bytes (uint32 LE): 0x" + Buffer.from(buff.slice(0,4)).reverse().toString('hex'));