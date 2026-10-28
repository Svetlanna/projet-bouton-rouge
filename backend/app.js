const express = require("express");
const cors = require("cors");
const { checkLogin, isValidCount, getClickResponse, MAX_CLICKS } = require("./logic");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});
app.post("/login", (req, res) => {
	const { username, password } = req.body || {};

	if (checkLogin(username, password)) {
		return res.json({
			success: true,
			message: "Bienvenue. Et surtout, ne touche pas au bouton."
		});
	}

	return res.status(401).json({
		success: false,
		message: "Identifiants incorrects."
	});
});

app.post("/click", (req, res) => {
	const { count } = req.body || {};

	if (!isValidCount(count)) {
		return res.status(400).json({
			error: `Le nombre de clics doit être compris entre 1 et ${MAX_CLICKS}.`
		});
	}

	return res.json(getClickResponse(count));
});

module.exports = app;
