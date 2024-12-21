const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();
const connectToDb = require("../db.js");



router.post("/", async (req, res) => {
    const { firstname, lastname, mail, phone, reason, message } = req.body;
    if (!firstname || !lastname || !mail || !phone || !reason || !message) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données." });
        }

        const sql = "INSERT INTO contact (firstname, lastname, mail, phone, reason, message) VALUES (?, ?, ?, ?, ?, ?)";
        result = await db.query(sql, [firstname, lastname, mail, phone, reason, message]);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: mail,
            to: process.env.EMAIL_USER,
            subject: `Nouveau message de ${firstname} ${lastname} - ${reason}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                    <h2>Nouveau message reçu depuis votre site</h2>
                    <p><strong>De :</strong> ${firstname} ${lastname}</p>
                    <p><strong>Email :</strong> ${mail}</p>
                    <p><strong>Téléphone :</strong> ${phone}</p>
                    <p><strong>Raison :</strong> ${reason}</p>
                    <p><strong>Message :</strong></p>
                    <blockquote style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #007bff;">${message}</blockquote>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "Message envoyé avec succès et notification envoyée !" });
    } catch (err) {
        console.error("Erreur lors de l'envoi du message :", err);
        res.status(500).json({ message: "Une erreur est survenue.", error: err.message });
    }
});



router.get("/tout", async (req, res) => {

    try {
      const db = await connectToDb();
      if (!db) { return res.status(500).json({ message: "Erreur à la base de données" }) }

        const sql = "SELECT * FROM contact";
        const [results] = await db.query(sql);
  
      res.status(200).json({ message: "listes des voyages du user" , data: results});
    } catch (err) {
      console.error("Erreur lors de la récuperation des voyage :", err);
      res.status(500).json({ message: "Erreur serveur", error: err });
    }
  });

module.exports = router;
