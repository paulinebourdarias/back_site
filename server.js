const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const connectToDb = require('./db.js');
require('dotenv').config();
const cors = require('cors');
const path = require("path");
const https = require('https');



const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


connectToDb();

const admin = require('./routes/admin.js')
app.use('/admin', admin);

const users = require('./routes/users.js')
app.use('/users', users);

const contact = require('./routes/contact.js')
app.use('/contact', contact);

const accueil = require('./routes/accueil.js')
app.use('/accueil', accueil);

const bilan = require('./routes/bilan.js')
app.use('/bilan', bilan);

const bannier = require('./routes/bannier.js')
app.use('/bannier', bannier);

const card = require('./routes/card.js')
app.use('/card', card);

const formation = require('./routes/formation.js')
app.use('/formation', formation);

const footer = require('./routes/footer.js')
app.use('/footer', footer);

setInterval(() => {
    https.get('https://back-site-hh0b.onrender.com');
    console.log('Auto-ping toutes les 10 minutes');
}, 6000000); // 600000 ms = 10 minutes


app.listen(process.env.PORT, () => {
    console.log(`Servers en marche sur le port ${process.env.PORT}`)
})
