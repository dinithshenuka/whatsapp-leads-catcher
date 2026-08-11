import { db } from './index';

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
