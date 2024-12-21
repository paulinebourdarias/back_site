const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Pour manipuler les fichiers
require("dotenv").config();
const connectToDb = require("../db.js");

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads/"); // Répertoire où enregistrer les fichiers
    },
    filename: (req, file, callback) => {
        callback(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

const upload = multer({
    storage: storage,
});

// ----- Routes ----- //

// GET : Récupérer tous les enregistrements de la table footer
router.get("/", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({
                message: "Erreur de connexion à la base de données",
            });
        }

        const sql = "SELECT * FROM footer";
        const [results] = await db.query(sql);

        res.status(200).json({
            message: "Données récupérées avec succès !",
            data: results,
        });
    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la récupération des données",
            error: err.message,
        });
    }
});

// POST : Créer un nouvel enregistrement dans la table footer
router.post("/createFooter", upload.single("image_footer"), async (req, res) => {
    const { title_footer } = req.body;
    const uploadedFile = req.file;

    if (!title_footer || !uploadedFile) {
        // Supprimez l'image temporaire si les champs sont incomplets
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            fs.unlinkSync(uploadedFile.path);
            return res.status(500).json({
                message: "Erreur de connexion à la base de données",
            });
        }

        const sql = `INSERT INTO footer (title_footer, image_footer) VALUES (?, ?)`;
        const [result] = await db.query(sql, [title_footer, uploadedFile.filename]);

        res.status(201).json({
            message: "Footer avec image créé avec succès !",
            data: { id: result.insertId },
        });
    } catch (err) {
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        res.status(500).json({
            message: "Erreur lors de la création du footer avec image",
            error: err.message,
        });
    }
});

// PUT : Mettre à jour les données de la table footer sans modifier l'image
router.put("/modifierFooter/:id_footer", async (req, res) => {
    const { title_footer } = req.body;
    const idFooter = req.params.id_footer;

    if (!title_footer) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({
                message: "Erreur de connexion à la base de données",
            });
        }

        const sql = `UPDATE footer SET title_footer = ? WHERE id_footer = ?`;
        const [result] = await db.query(sql, [title_footer, idFooter]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Footer mis à jour avec succès !" });
    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la mise à jour du footer",
            error: err.message,
        });
    }
});

// PUT : Mettre à jour l'image dans la table footer
router.put("/modifierFooterImage/:id_footer", upload.single("image_footer"), async (req, res) => {
    const idFooter = req.params.id_footer;
    const uploadedFile = req.file;

    if (!uploadedFile) {
        return res.status(400).json({ message: "Aucune image fournie." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            fs.unlinkSync(uploadedFile.path);
            return res.status(500).json({
                message: "Erreur de connexion à la base de données",
            });
        }

        // Supprimez l'ancienne image si nécessaire
        const getOldImageQuery = `SELECT image_footer FROM footer WHERE id_footer = ?`;
        const [rows] = await db.query(getOldImageQuery, [idFooter]);
        if (rows.length > 0 && rows[0].image_footer) {
            const oldImagePath = path.join("./uploads/", rows[0].image_footer);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Mettez à jour la base de données avec la nouvelle image
        const sql = `UPDATE footer SET image_footer = ? WHERE id_footer = ?`;
        const [result] = await db.query(sql, [uploadedFile.filename, idFooter]);

        if (result.affectedRows === 0) {
            fs.unlinkSync(uploadedFile.path);
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({
            message: "Image et base de données mises à jour avec succès !",
            updatedImageName: uploadedFile.filename,
        });
    } catch (err) {
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path);
        }
        res.status(500).json({
            message: "Erreur lors de la mise à jour de l'image footer",
            error: err.message,
        });
    }
});
// DELETE : Supprimer un enregistrement de la table footer et son image associée
router.delete("/supprimerFooter/:id_footer", async (req, res) => {
    const idFooter = req.params.id_footer;

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({
                message: "Erreur de connexion à la base de données",
            });
        }

        // Récupérer l'image associée
        const getImageQuery = `SELECT image_footer FROM footer WHERE id_footer = ?`;
        const [rows] = await db.query(getImageQuery, [idFooter]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Aucune ligne trouvée pour suppression.",
            });
        }

        const imagePath = path.join("./uploads/", rows[0].image_footer);

        // Supprimer l'image du serveur
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Supprimer l'enregistrement de la base de données
        const deleteQuery = `DELETE FROM footer WHERE id_footer = ?`;
        const [result] = await db.query(deleteQuery, [idFooter]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Aucune ligne supprimée.",
            });
        }

        res.status(200).json({
            message: "Footer et son image associés supprimés avec succès.",
        });
    } catch (err) {
        res.status(500).json({
            message: "Erreur lors de la suppression du footer",
            error: err.message,
        });
    }
});

module.exports = router;
