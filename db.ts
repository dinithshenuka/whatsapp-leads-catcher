import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite3Verbose = sqlite3.verbose();
const dbPath = path.resolve(__dirname, 'leads.db');

export const db = new sqlite3Verbose.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb(): void {
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            phone_number TEXT PRIMARY KEY,
            message_body TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
        )
    `, (err: Error | null) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Leads table ready.');
        }
    });
}

export function insertLead(phoneNumber: string, messageBody: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT OR IGNORE INTO leads (phone_number, message_body)
            VALUES (?, ?)
        `;
        db.run(sql, [phoneNumber, messageBody], function(err: Error | null) {
            if (err) {
                console.error('Error inserting lead:', err.message);
                reject(err);
            } else {
                if (this.changes > 0) {
                    console.log(`New lead saved: ${phoneNumber}`);
                }
                resolve();
            }
        });
    });
}
