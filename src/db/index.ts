import sqlite3 from 'sqlite3';
import { ENV } from '../config/env';

const sqlite3Verbose = sqlite3.verbose();

export const db = new sqlite3Verbose.Database(ENV.DB_PATH);

export function initDb(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS leads (
                phone_number TEXT PRIMARY KEY,
                name TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'new'
            )
        `, (err: Error | null) => {
            if (err) {
                console.error('Error creating table:', err.message);
                reject(err);
            } else {
                console.log('Leads table ready.');
                resolve();
            }
        });
    });
}

export function insertLead(phoneNumber: string, name: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT OR IGNORE INTO leads (phone_number, name)
            VALUES (?, ?)
        `;
        db.run(sql, [phoneNumber, name], function(err: Error | null) {
            if (err) {
                console.error('Error inserting lead:', err.message);
                reject(err);
            } else {
                if (this.changes > 0) {
                    console.log(`New lead saved: ${name ? name + ' (' + phoneNumber + ')' : phoneNumber}`);
                }
                resolve();
            }
        });
    });
}
