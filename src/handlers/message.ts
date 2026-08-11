import { Message } from 'whatsapp-web.js';
import { insertLead } from '../db';

export async function handleIncomingMessage(msg: Message): Promise<void> {
    try {
        const phoneNumber = msg.from; // Usually in format '1234567890@c.us'
        const messageBody = msg.body;

        // Skip status broadcasts
        if (phoneNumber === 'status@broadcast') return;

        // Extract phone number by removing the @c.us suffix
        const formattedPhone = phoneNumber.split('@')[0];

        console.log(`Received message from ${formattedPhone}: ${messageBody}`);
        
        await insertLead(formattedPhone, messageBody);
    } catch (error) {
        console.error('Error handling incoming message:', error);
    }
}
