import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { insertLead } from './db';

const client = new Client({
    // Use LocalAuth to save session data so we don't have to scan QR code every time
    authStrategy: new LocalAuth()
});

client.on('qr', (qr: string) => {
    // Generate and scan this code with your phone
    console.log('Please scan the QR code below to authenticate:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready! Listening for incoming messages...');
});

client.on('message', async (msg: Message) => {
    try {
        const phoneNumber = msg.from; // Usually in format '1234567890@c.us'
        const messageBody = msg.body;

        // Skip status broadcasts
        if (phoneNumber === 'status@broadcast') return;

        // Optional: formatting the phone number to remove the @c.us suffix
        const formattedPhone = phoneNumber.split('@')[0];

        console.log(`Received message from ${formattedPhone}: ${messageBody}`);
        
        await insertLead(formattedPhone, messageBody);
    } catch (error) {
        console.error('Error handling incoming message:', error);
    }
});

client.initialize();
