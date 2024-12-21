const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");



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



router.get("/", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const sql = "SELECT * FROM bilan";
        const [results] = await db.query(sql);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});



router.put("/modifierBilan", async (req, res) => {
    const {title_bilan, description_bilan, title_section_bilan, info_bilan_1, info_bilan_2, info_bilan_3, phrase} = req.body;
    if (!title_bilan || !description_bilan || !title_section_bilan || !info_bilan_1 || !info_bilan_2 || !info_bilan_3 || !phrase) { 
        return res.status(400).json({ message: 'Tous les champs sont requis.' }) 
    }

    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const sql = 
        `UPDATE bilan SET 
        title_bilan = ?, description_bilan = ?, title_section_bilan = ?, info_bilan_1 = ?, info_bilan_2 = ?, info_bilan_3 = ?, phrase = ?`;
        const [result] = await db.query(sql, [title_bilan, description_bilan, title_section_bilan, info_bilan_1, info_bilan_2, info_bilan_3, phrase]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Bilan mis à jour avec succès !" });
    } catch (err) {
        res.status(500).json("Erreur lors de la mise à jour de l'accueil :", err);
    }
});



const fs = require("fs"); // Pour manipuler les fichiers

router.put("/modifierBilanImage", upload.single("image_bilan"), async (req, res) => {
    const uploadedFile = req.file; // Fichier temporairement sauvegardé
    let image_bilan = "";

    if (uploadedFile) {
        image_bilan = uploadedFile.filename; // Nom temporaire du fichier
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
            UPDATE bilan 
            SET image_bilan = ?`;
        const [result] = await db.query(sql, [image_bilan]);

        if (result.affectedRows === 0) {
            // Supprimer l'image si aucune ligne n'est mise à jour
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        // Tout s'est bien passé, envoyer une réponse de succès
        res.status(200).json({ message: "Image du bilan mise à jour avec succès !" });
    } catch (err) {
        // Supprimer l'image temporaire en cas d'erreur
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour de l'image du bilan.", 
            error: err.message // Ajouter le message d'erreur pour le débogage
        });
    }
});
  



module.exports = router;
