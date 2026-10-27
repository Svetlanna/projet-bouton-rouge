
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let echecs = 0;


async function post(chemin, donnees) {
	const res = await fetch(BASE_URL + chemin, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(donnees)
	});
	const body = await res.json();
	return { status: res.status, body };
}


function verifier(description, condition, detail) {
	if (condition) {
		console.log(`  ✓ ${description}`);
	} else {
		console.log(`  ✗ ${description}  ->  reçu : ${JSON.stringify(detail)}`);
		echecs++;
	}
}


async function attendreServeur() {
	for (let i = 1; i <= 20; i++) {
		try {
			await fetch(BASE_URL + "/login", { method: "POST" });
			return;                                       // le serveur a répondu
		} catch {
			await new Promise(r => setTimeout(r, 1000));  // pas encore prêt, on attend 1 s
		}
	}
	console.error(`Le serveur ne répond pas sur ${BASE_URL}`);
	process.exit(1);
}

async function main() {
	console.log(`Test smoke sur ${BASE_URL}`);
	await attendreServeur();

	// bons identifiants -> 200 et success = true
	let r = await post("/login", { username: "admin", password: "docker" });
	verifier("POST /login avec admin/docker répond 200", r.status === 200 && r.body.success === true, r);

	// mauvais identifiants -> 401
	r = await post("/login", { username: "x", password: "y" });
	verifier("POST /login avec de mauvais identifiants répond 401", r.status === 401, r);

	// clic 30 -> fin de partie
	r = await post("/click", { count: 30 });
	verifier("POST /click count=30 termine la partie", r.status === 200 && r.body.finished === true, r);

	// clic 31 -> refusé
	r = await post("/click", { count: 31 });
	verifier("POST /click count=31 répond 400", r.status === 400, r);

	// bilan : un code de sortie différent de 0 fait échouer l'étape de la CI
	if (echecs > 0) {
		console.log(`\n${echecs} vérification(s) en échec`);
		process.exit(1);
	}
	console.log("\nTout est OK");
}

main();