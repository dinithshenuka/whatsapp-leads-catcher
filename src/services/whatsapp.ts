import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { ENV } from '../config/env';
import { handleIncomingMessage } from '../handlers/message';
import { insertLead } from '../db';

export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: ENV.PUPPETEER_EXECUTABLE_PATH,
    }
});

export function initializeWhatsAppClient(): void {
    whatsappClient.on('qr', (qr: string) => {
        console.log('Please scan the QR code below to authenticate:');
        qrcode.generate(qr, { small: true });
    });

    whatsappClient.on('ready', async () => {
        console.log('WhatsApp Client is ready! Syncing existing leads...');
        try {
            const chats = await whatsappClient.getChats();
            let count = 0;
            for (const chat of chats) {
                if (!chat.isGroup) {
                    const contact = await chat.getContact();
                    const phoneNumber = contact.number;
                    const name = contact.name || contact.pushname || chat.name || null;
                    if (phoneNumber) {
                        await insertLead(phoneNumber, name);
                        count++;
                    }
                }
            }
            console.log(`Successfully synced existing chats. Found ${count} individual chats.`);
            console.log('Listening for any new incoming messages...');
        } catch (error) {
            console.error('Error syncing existing leads:', error);
        }
    });

    whatsappClient.on('message', handleIncomingMessage);

    whatsappClient.initialize().catch((err: Error) => {
        console.error('Failed to initialize WhatsApp client:', err);
    });
}
