const { messages, MAX_CLICKS, checkLogin, isValidCount, getClickResponse } = require("../logic");


describe("checkLogin", () => {

    	test("accepte admin / docker", () => {
		// expect(valeur obtenue).toBe(valeur attendue)
		expect(checkLogin("admin", "docker")).toBe(true);
	});

	test("refuse un mauvais mot de passe", () => {
		expect(checkLogin("admin", "mauvais")).toBe(false);
	});

	test("refuse un mauvais identifiant", () => {
		expect(checkLogin("bob", "docker")).toBe(false);
	});

	test("refuse des identifiants vides ou absents", () => {
		expect(checkLogin("", "")).toBe(false);
		expect(checkLogin(undefined, undefined)).toBe(false);
	});

	test("est sensible aux majuscules", () => {
		expect(checkLogin("Admin", "docker")).toBe(false);
	});
});

describe("isValidCount", () => {
	test("accepte les bornes 1 et 30", () => {
		expect(isValidCount(1)).toBe(true);
		expect(isValidCount(30)).toBe(true);
	});


	test.each([0, -1, 31, 1.5, "5", null, undefined])("refuse la valeur %p", (valeur) => {
		expect(isValidCount(valeur)).toBe(false);
	});
});

describe("getClickResponse", () => {
	test("le 1er clic renvoie le 1er message", () => {
		const reponse = getClickResponse(1);
		// toEqual compare le CONTENU d'un objet (toBe compare l'identité)
		expect(reponse).toEqual({
			count: 1,
			message: "Je t'avais pourtant prévenu.",
			finished: false
		});
	});

	test("le dernier clic termine la partie", () => {
		const reponse = getClickResponse(30);
		expect(reponse.finished).toBe(true);
		expect(reponse.message).toContain("BOUM");   // toContain : le texte contient...
	});

	test("seul le dernier clic termine la partie", () => {
		for (let i = 1; i < MAX_CLICKS; i++) {
			expect(getClickResponse(i).finished).toBe(false);
		}
	});
});

describe("messages", () => {
	test("il y a exactement 30 messages", () => {
		expect(messages).toHaveLength(30);
	});

	test("aucun message n'est vide", () => {
		for (const m of messages) {
			expect(m.trim()).not.toBe("");
		}
	});
});