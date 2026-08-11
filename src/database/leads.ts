import { db } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';

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

export function printLeadsTable(days?: number): Promise<void> {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM leads";
        let params: any[] = [];
        
        if (days) {
            sql += " WHERE timestamp >= datetime('now', ?)";
            params.push(`-${days} days`);
        }
        
        db.all(sql, params, (err: Error | null, rows: any[]) => {
            if (err) {
                console.error('Error fetching leads:', err.message);
                reject(err);
            } else {
                console.log('\n--- Leads Table ---');
                console.table(rows);
                resolve();
            }
        });
    });
}

export function exportLeadsToCSV(days?: number): Promise<void> {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM leads";
        let params: any[] = [];
        
        if (days) {
            sql += " WHERE timestamp >= datetime('now', ?)";
            params.push(`-${days} days`);
        }
        
        db.all(sql, params, async (err: Error | null, rows: any[]) => {
            if (err) {
                console.error('Error fetching leads for export:', err.message);
                reject(err);
                return;
            }

            try {
                if (rows.length === 0) {
                    console.log('No leads found to export.');
                    resolve();
                    return;
                }

                const columns = Object.keys(rows[0]);
                const csvRows = [];
                
                // Add header
                csvRows.push(columns.join(','));
                
                // Add rows
                for (const row of rows) {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null || val === undefined) return '';
                        // Escape quotes and wrap in quotes if contains comma
                        const strVal = String(val).replace(/"/g, '""');
                        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                            return `"${strVal}"`;
                        }
                        return strVal;
                    });
                    csvRows.push(values.join(','));
                }
                
                const csvString = csvRows.join('\n');
                const filename = `leads_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
                const filepath = path.join(process.cwd(), filename);
                
                await fs.writeFile(filepath, csvString, 'utf-8');
                console.log(`\nSuccessfully exported ${rows.length} leads to: ${filename}`);
                resolve();
            } catch (fsErr) {
                console.error('Error writing CSV file:', fsErr);
                reject(fsErr);
            }
        });
    });
}
