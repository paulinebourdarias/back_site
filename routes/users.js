const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");
const jwt = require("jsonwebtoken");


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

        const sql = "SELECT * FROM users"
        const [results] = await db.query(sql);

        res.status(200).json({ message: "Données récupérées avec succès !", data: results });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des données", error: err.message });
    }
});



router.post("/login", async (req, res) => {
    const { mail, password } = req.body;
    if (!mail || !password) { return res.status(400).json({ message: "Nom d'utilisateur et mot de passe sont requis." }) }
    console.log(mail, password); // Pour vérifier les données reçues

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const sql = "SELECT * FROM users WHERE mail = ?";
        const [results] = await db.query(sql, [mail]);

        if (!results || results.length === 0) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
        }

        const user = results[0];
        //   const isMatch = await bcrypt.compare(password, user.password);

        //   if (!isMatch) {
        //     return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
        //   }

        const token = jwt.sign(
            { id: user.id, mail: user.mail },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ message: "Utilisateur connecté", token });
    } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        res.status(500).json({ message: "Erreur lors de la connexion.", error: err.message });
    }
});


router.put("/modifierProfile", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const {
            title_description,
            description1,
            description2,
            description3
        } = req.body;

        const sql = `
              UPDATE users 
              SET title_description = ?, description1 = ?, description2 = ?, description3 = ?`;

        const params = [
            title_description,
            description1,
            description2,
            description3,
        ];

        await db.query(sql, params);

        res.status(200).json({ message: "Informations utilisateur mises à jour avec succès !" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour des informations utilisateur :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour des informations utilisateur.", error: err.message });
    }
});

router.put("/modifierTitleFormation", async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const {
            title_page_formation,
            
        } = req.body;

        const sql = `
              UPDATE users 
              SET title_page_formation = ?`;

        const params = [
            title_page_formation
           
        ];

        await db.query(sql, params);

        res.status(200).json({ message: "Informations utilisateur mises à jour avec succès !" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour des informations utilisateur :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour des informations utilisateur.", error: err.message });
    }
});


router.put("/modifierColor", async (req, res) => {
    const {
        colordeg1,
        colordeg2,
        pinkCard,
        allButon,
        text,
        textcard

    } = req.body;

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const sql = `
            UPDATE users 
            SET colordeg1 = ?, colordeg2 = ? , pinkCard = ?, allButon = ?, colortext = ?, textcard = ?`;

        const params = [
            colordeg1,
            colordeg2,
            pinkCard,
            allButon,
            text,
            textcard

        ];

        await db.query(sql, params);

        res.status(200).json({ message: "couleurs modifier !" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour des couleurs :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour des couleur utilisateur.", error: err.message });
    }
});


const fs = require("fs");

router.put("/modifierProfileLogo", upload.single("logo"), async (req, res) => {
    const uploadedFile = req.file;
    const logo = uploadedFile ? uploadedFile.filename : null;

    if (!logo) {
        return res.status(400).json({ message: "Le fichier logo est requis." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path); // Supprime le fichier en cas d'échec
            }
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const sql = `UPDATE users SET logo = ?`;
        const params = [logo];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path); // Supprime le fichier si aucune ligne n'est mise à jour
            }
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Logo mis à jour avec succès !", updatedLogoFilename: logo  });
    } catch (err) {
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path); // Supprime le fichier en cas d'erreur
        }
        console.error("Erreur lors de la mise à jour du logo :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du logo.", error: err.message });
    }
});

router.put("/modifierProfileImage", upload.single("image"), async (req, res) => {
    const uploadedFile = req.file;
    const image = uploadedFile ? uploadedFile.filename : null;

    if (!image) {
        return res.status(400).json({ message: "Le fichier image est requis." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path); // Supprime le fichier en cas d'échec
            }
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const sql = `UPDATE users SET image = ?`;
        const params = [image];
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            if (uploadedFile) {
                fs.unlinkSync(uploadedFile.path); // Supprime le fichier si aucune ligne n'est mise à jour
            }
            return res.status(404).json({ message: "Aucune ligne trouvée pour mise à jour." });
        }

        res.status(200).json({ message: "Image mise à jour avec succès !" });
    } catch (err) {
        if (uploadedFile) {
            fs.unlinkSync(uploadedFile.path); // Supprime le fichier en cas d'erreur
        }
        console.error("Erreur lors de la mise à jour de l'image :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour de l'image.", error: err.message });
    }
});



module.exports = router;
