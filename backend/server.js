// server.js
// Ce fichier ne fait plus qu'une chose : démarrer l'application sur un port.

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
	console.log(`API démarrée sur le port ${PORT}`);
});