const urlStr = "local://music/shes-gone.mp3?t=1779801761307";
const url = new URL(urlStr);
console.log("NON-STANDARD PROTOCOL PARSING:");
console.log("url.protocol:", JSON.stringify(url.protocol));
console.log("url.host:", JSON.stringify(url.host));
console.log("url.pathname:", JSON.stringify(url.pathname));
console.log("Reconstructed path (url.host + url.pathname):", JSON.stringify(url.host + url.pathname));
