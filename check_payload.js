// to_b64.js
const hex = "b5ee9c7201010101000e0000182f4a7cbb0000000000000000"; // вставь hex payload
const b = Buffer.from(hex, "hex");
console.log(b.toString("base64"));