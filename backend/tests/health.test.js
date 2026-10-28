const request = require("supertest");
const app = require("../app");

describe("GET /health", () => {
	test("répond 200 avec status ok", async () => {
		const res = await request(app).get("/health");   // .get() car c'est une route GET

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: "ok" });
	});
});