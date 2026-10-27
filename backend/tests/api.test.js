const request = require("supertest");
const app = require("../backend/app");

describe("POST /login", () => {

	test("répond 200 avec les bons identifiants", async () => {
		const res = await request(app)
			.post("/login")
			.send({ username: "admin", password: "docker" });  // corps JSON

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	test("répond 401 avec de mauvais identifiants", async () => {
		const res = await request(app)
			.post("/login")
			.send({ username: "admin", password: "faux" });

		expect(res.status).toBe(401);
		expect(res.body).toEqual({ success: false, message: "Identifiants incorrects." });
	});

	test("répond 401 si on n'envoie rien", async () => {
		const res = await request(app).post("/login");
		expect(res.status).toBe(401);
	});
});

describe("POST /click", () => {
	test("répond 200 et le bon message pour un clic valide", async () => {
		const res = await request(app).post("/click").send({ count: 7 });

		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Alerte transmise à la NASA.");
	});

	test("répond 400 si count dépasse 30", async () => {
		const res = await request(app).post("/click").send({ count: 31 });

		expect(res.status).toBe(400);
		expect(res.body.error).toBeDefined();
	});

	test("répond 400 si count est absent", async () => {
		const res = await request(app).post("/click").send({});
		expect(res.status).toBe(400);
	});
});