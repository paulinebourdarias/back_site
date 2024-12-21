const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const connectToDb = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!pool) {
        pool = mysql.createPool({
            host: isProduction ? process.env.PROD_DB_HOST : process.env.DB_HOST,
            user: isProduction ? process.env.PROD_DB_USER : process.env.DB_USER,
            database: isProduction ? process.env.PROD_DB_NAME : process.env.DB_NAME,
            password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD,
            port: isProduction ? process.env.PROD_DB_PORT : process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10, // Nombre maximum de connexions dans le pool
            queueLimit: 0,       // Pas de limite pour la file d'attente
        });

        console.log('Pool de connexions MySQL initialisé.');
    }

    return pool;
};

const keepAlive = () => {
    setInterval(async () => {
        try {
            const connection = await pool.getConnection();
            await connection.ping(); // Envoie une requête ping pour garder la connexion active
            console.log('Keep-alive MySQL exécuté.');
            connection.release(); // Libère la connexion après le ping
        } catch (error) {
            console.error('Erreur lors du keep-alive MySQL :', error.message);
        }
    }, 300000); // Toutes les 5 minutes (300 000 ms)
};

// Initialisation du pool et lancement du keep-alive
connectToDb(); // Crée le pool au démarrage
keepAlive();   // Démarre le keep-alive

// Exportation de la fonction connectToDb
module.exports = connectToDb;
