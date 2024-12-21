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

        const sql = "SELECT * FROM formation";
        const [results] = await db.query(sql);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});

router.get("/:id_formation", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const formationId = req.params.id_formation;

        const sql = "SELECT * FROM formation WHERE id_formation = ?";
        const [results] = await db.query(sql,[formationId]);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results[0] });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});

router.post(
    "/createFormation",
    upload.single("image_formation"),
    async (req, res) => {
        const { title_formation, description_formation, text_button, description_formation_card } = req.body;
        const uploadedFile = req.file;
        let image_formation = "";

        if (!title_formation || !description_formation || !text_button || !description_formation_card) {
            // Supprimez l'image temporaire si les champs sont incomplets
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        if (uploadedFile) {
            image_formation = uploadedFile.filename; // Nom temporaire du fichier
        }

        try {
            const db = await connectToDb();
            if (!db) {
                if (uploadedFile) {
                    fs.unlinkSync(uploadedFile.path);
                }
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            const sql = `
                INSERT INTO formation 
                (title_formation, description_formation, text_button, description_formation_card, image_formation) 
                VALUES (?, ?, ?, ?, ?)`;

            const [result] = await db.query(sql, [
                title_formation,
                description_formation,
                text_button,
                description_formation_card,
                image_formation,
            ]);

            res.status(201).json({
                message: "Formation avec image créée avec succès !",
                data: { id: result.insertId },
            });
        } catch (err) {
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            res.status(500).json({
                message: "Erreur lors de la création de la formation avec image",
                error: err.message,
            });
        }
    }
);



router.put("/modifierFormation/:id_formation", async (req, res) => {
    const {title_formation, description_formation, text_button, description_formation_card } = req.body;
    if (!title_formation || !description_formation || !text_button || !description_formation_card) { 
        return res.status(400).json({ message: 'Tous les champs sont requis.' }) 
    }

    try {
        const db = await connectToDb();
        if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" }) }

        const formationId = req.params.id_formation;

        const sql = 
        `UPDATE formation SET 
        title_formation = ?, description_formation = ? , text_button = ?  , description_formation_card = ? 
        WHERE id_formation = ?`;
        const [result] = await db.query(sql, [title_formation, description_formation, text_button, description_formation_card, formationId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Formtion mis à jour avec succès !" });
    } catch (err) {
        res.status(500).json("Erreur lors de la mise à jour de la formation :", err);
    }
});
  
  

const fs = require("fs"); // Pour manipuler les fichiers


router.put(
    "/modifierFormationImage/:id_formation",
    upload.single("image_formation"),
    async (req, res) => {
        const idformation = req.params.id_formation;
        const uploadedFile = req.file; // Fichier temporairement sauvegardé
        let image_formation = "";

        if (uploadedFile) {
            image_formation = uploadedFile.filename; // Nom temporaire du fichier
        }

        try {
            const db = await connectToDb();
            if (!db) {
                // Supprimer le fichier temporaire en cas d'erreur de connexion
                if (uploadedFile) {
                    fs.unlinkSync(uploadedFile.path);
                }
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            // Mise à jour en base de données
            const sql = `UPDATE formation SET image_formation = ? WHERE id_formation = ?`;
            const [result] = await db.query(sql, [image_formation, idformation]);

            if (result.affectedRows === 0) {
                // Supprimer l'image si la base de données n'a pas été modifiée
                if (uploadedFile) {
                    fs.unlinkSync(uploadedFile.path);
                }
                return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
            }

            // Si tout fonctionne bien, réponse de succès
            res.status(200).json({ message: "Image et base de données mises à jour avec succès !" });
        } catch (err) {
            // Supprimer le fichier temporaire en cas d'erreur
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path);
            }
            res.status(500).json({
                message: "Erreur lors de la mise à jour de l'image formation",
                error: err.message, // Détails pour le débogage
            });
        }
    }
);



router.delete("/deleteFormation/:id_formation", async (req, res) => {
    const idFormation = req.params.id_formation;

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const sql = "DELETE FROM formation WHERE id_formation = ?";
        const [result] = await db.query(sql, [idFormation]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Formation non trouvée pour suppression." });
        }

        res.status(200).json({ message: "Formation supprimée avec succès !" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression de la formation.", error: err.message });
    }
});

module.exports = router;
