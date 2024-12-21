const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginRoute = require("../routes/admin.js"); 
const app = express();
app.use(express.json());
app.use("/", loginRoute);



describe("POST /login", () => {
    beforeAll(() => {
        jest.spyOn(bcrypt, "compare");
        jest.spyOn(jwt, "sign");
    });

    afterAll(() => {
        jest.restoreAllMocks(); // Nettoyer les mocks après les tests
    });



    test("Retourne une erreur si les champs sont manquants", async () => {
        const res = await request(app).post("/login").send({ username: "", password: "" });

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: "Nom d'utilisateur et mot de passe sont requis." });
    });



    test("Retourne une erreur si l'utilisateur n'existe pas", async () => {
        const res = await request(app).post("/login").send({ username: "inconnu", password: "password123" });

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ message: "Nom d'utilisateur ou mot de passe incorrect" });
    });



    test("Retourne une erreur si le mot de passe est incorrect", async () => {
        bcrypt.compare.mockResolvedValue(false); // Simule bcrypt.compare retournant faux

        const res = await request(app).post("/login").send({ username: "admin", password: "wrongpassword" });

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ message: "Nom d'utilisateur ou mot de passe incorrect" });
    });


    
    test("Connecté avec succès", async () => {
        bcrypt.compare.mockResolvedValue(true); // Simule bcrypt.compare retournant vrai
        jwt.sign.mockReturnValue("faketoken"); // Simule la génération d'un token JWT

        const res = await request(app).post("/login").send({ username: "admin", password: "password123" });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Utilisateur connecté", token: "faketoken" });
    });
});
