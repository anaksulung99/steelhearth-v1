const urlStr = "local://music/shes-gone.mp3?t=1779801761307";
const url = new URL(urlStr);
console.log("url.protocol:", url.protocol);
console.log("url.host:", url.host);
console.log("url.pathname:", url.pathname);
console.log("Reconstructed path:", url.host + url.pathname);
