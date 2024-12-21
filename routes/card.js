const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");

// -----Upload
const multer = require('multer')
const path = require('path')

let storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')     // './uploads/' directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({
    storage: storage
});

// FIN Upload--------------------


router.get("/", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const sql = "SELECT * FROM card";
        const [results] = await db.query(sql);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});



router.put("/modifierCard/:id_card", async (req, res) => {
    const {description, infoBull1, infoBull2, title} = req.body;
    if (!description || !infoBull1 || !infoBull2 || !title ) { 
        return res.status(400).json({ message: 'Tous les champs sont requis.' }) 
    }

    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const cardId = req.params.id_card;

        const sql = 
        `UPDATE card 
        SET description = ?, infoBull1 = ? , infoBull2 = ? , title = ? 
        WHERE id_card = ?`;
        const [result] = await db.query(sql, [ description, infoBull1, infoBull2, title, cardId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Card mis à jour avec succès !" });
    } catch (err) {
        res.status(500).json("Erreur lors de la mise à jour de l'accueil :", err);
    }
});
  

const fs = require("fs"); // Pour la gestion des fichiers

router.put("/modifierCardImage/:id_card", upload.single("bgimage"), async (req, res) => {
    const cardId = req.params.id_card;
    const uploadedFile = req.file; // Fichier temporairement sauvegardé par multer
    let bgimage = "";

    if (uploadedFile) {
        bgimage = uploadedFile.filename; // Nom temporaire du fichier
    }

    try {
        const db = await connectToDb();
        if (!db) {
            // Supprimer le fichier temporaire si la connexion échoue
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // Mise à jour en base de données
        const sql = `
            UPDATE card 
            SET bgimage = ? 
            WHERE id_card = ?`;
        const [result] = await db.query(sql, [bgimage, cardId]);

        if (result.affectedRows === 0) {
            // Supprimer l'image si aucune ligne n'est mise à jour
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        // Tout s'est bien passé, envoyer une réponse de succès
        res.status(200).json({ message: "Image de la carte mise à jour avec succès !" });
    } catch (err) {
        // Supprimer l'image temporaire en cas d'erreur
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour de l'image de la carte.", 
            error: err.message // Ajouter le message d'erreur pour le débogage
        });
    }
});




module.exports = router;
