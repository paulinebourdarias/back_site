const request = require("supertest");
const express = require("express");
const bannierRoutes = require("../routes/bannier.js");

// Mock de la connexion à la base de données
jest.mock("../db.js", () => jest.fn());
const connectToDb = require("../db.js");

// Configuration de l'application de test
const app = express();
app.use(express.json());
app.use("/bannier", bannierRoutes);

describe("Test GET /bannier/:id_bannier", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });



    test("Récupération des données avec succès", async () => {
        const mockQuery = jest.fn().mockResolvedValueOnce([
            [{ id_bannier: 1, titre_bannier: "Titre", description_bannier: "Description" }],
        ]);

        connectToDb.mockResolvedValueOnce({ query: mockQuery });

        const response = await request(app).get("/bannier/1");
        console.log("Response Body:", response.body); // Debug si besoin

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Données récupérées avec succès !",
            data: { id_bannier: 1, titre_bannier: "Titre", description_bannier: "Description" },
        });
        expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM bannier WHERE id_bannier = ?", [1]);
    });

    test("Erreur lors de la récupération des données", async () => {
        const mockQuery = jest.fn().mockRejectedValueOnce(new Error("Erreur SQL"));
        connectToDb.mockResolvedValueOnce({ query: mockQuery });

        const response = await request(app).get("/bannier/1");
        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            message: "Erreur lors de la récupération des données",
            error: "Erreur SQL",
        });
    });



    test("Mise à jour réussie de la bannière", async () => {
        const mockQuery = jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]);
        connectToDb.mockResolvedValueOnce({ query: mockQuery });
    
        const payload = {
            titre_bannier: "Nouveau Titre",
            description_bannier: "Nouvelle Description",
        };
    
        const response = await request(app)
            .put("/bannier/modifierBannier/1")
            .send(payload);
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Bannière mis à jour avec succès !" });
        expect(mockQuery).toHaveBeenCalledWith(
            "UPDATE bannier SET titre_bannier = ?, description_bannier = ? WHERE id_bannier = ?",
            ["Nouveau Titre", "Nouvelle Description", 1]
        );
    });


    test("Mise à jour échouée - Champs manquants", async () => {
        const response = await request(app)
            .put("/bannier/modifierBannier/1")
            .send({ titre_bannier: "Titre" });
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Tous les champs sont requis." });
    });
});
