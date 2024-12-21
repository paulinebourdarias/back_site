const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");



router.get("/:id_bannier", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) { 
            console.error("Erreur : Connexion à la base de données impossible.");
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const bannierId = parseInt(req.params.id_bannier, 10);

        const sql = "SELECT * FROM bannier WHERE id_bannier = ?";
        const [results] = await db.query(sql, [bannierId]);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results[0] });
    } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});



router.put("/modifierBannier/:id_bannier", async (req, res) => {
    const {titre_bannier, description_bannier} = req.body;
    if (!titre_bannier || !description_bannier) { 
        return res.status(400).json({ message: 'Tous les champs sont requis.' }) 
    }

    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const bannierId = parseInt(req.params.id_bannier, 10);

        const sql = 
        `UPDATE bannier SET titre_bannier = ?, description_bannier = ? WHERE id_bannier = ?`;
        const [result] = await db.query(sql, [titre_bannier, description_bannier, bannierId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Bannière mis à jour avec succès !" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la bannière :", err);
        res.status(500).json("Erreur lors de la mise à jour de l'accueil :", err);
    }
});
  



module.exports = router;
