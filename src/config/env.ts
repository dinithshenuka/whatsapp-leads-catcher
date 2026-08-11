import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
    PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
    DB_PATH: process.env.DB_PATH || path.resolve(process.cwd(), 'leads.db')
};
