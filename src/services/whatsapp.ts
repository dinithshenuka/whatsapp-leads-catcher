import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { ENV } from '../config/env';
import { handleIncomingMessage } from '../handlers/message';

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

    whatsappClient.on('ready', () => {
        console.log('WhatsApp Client is ready! Listening for incoming messages...');
    });

    whatsappClient.on('message', handleIncomingMessage);

    whatsappClient.initialize().catch((err: Error) => {
        console.error('Failed to initialize WhatsApp client:', err);
    });
}
