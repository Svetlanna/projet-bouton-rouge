const messages = [
	"Je t'avais pourtant prévenu.",
	"Tu as vraiment du mal avec les consignes.",
	"Bon. Une fois, ça passe.",
	"Tu comptes continuer longtemps ?",
	"Ce bouton n'est PAS un jouet.",
	"Je commence à perdre patience.",
	"Alerte transmise à la NASA.",
	"La NASA demande pourquoi tu continues.",
	"Un satellite vient de changer d'orbite.",
	"Bravo. Tu as réveillé un volcan.",
	"Le volcan est très contrarié.",
	"Ton adresse IP a été communiquée aux pingouins.",
	"Les pingouins préparent leur vengeance.",
	"Un technicien vient de démissionner.",
	"Deux techniciens supplémentaires ont démissionné.",
	"Le serveur commence à transpirer.",
	"Température du processeur : 847 °C.",
	"Une intelligence artificielle demande l'asile politique.",
	"Le ministère des boutons rouges a été prévenu.",
	"Tu fais maintenant l'objet d'une enquête.",
	"Une commission parlementaire est constituée.",
	"Les marchés financiers commencent à paniquer.",
	"La Bourse de Tokyo vient de fermer.",
	"Internet fonctionne désormais au charbon.",
	"Un compte à rebours vient de démarrer.",
	"5...",
	"4...",
	"3...",
	"2...",
	"BOUM !  Félicitations. Tu as détruit Internet. Actualise la page pour recommencer"
];


const MAX_CLICKS = messages.length;

// Vérifie les identifiants/ true ou false.
function checkLogin(username, password) {
	return username === "admin" && password === "docker";
}


function isValidCount(count) {
	return Number.isInteger(count) && count >= 1 && count <= MAX_CLICKS;
}


function getClickResponse(count) {
	return {
		count,
		message: messages[count - 1],
		finished: count === MAX_CLICKS
	};
}


module.exports = { messages, MAX_CLICKS, checkLogin, isValidCount, getClickResponse };