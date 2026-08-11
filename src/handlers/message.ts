import { Message } from 'whatsapp-web.js';
import { insertLead } from '../db';

export async function handleIncomingMessage(msg: Message): Promise<void> {
    try {
        const contact = await msg.getContact();
        const phoneNumber = contact.number;
        const name = contact.name || contact.pushname || null;

        // Skip status broadcasts
        if (phoneNumber === 'status@broadcast') return;

        console.log(`Received message from ${name ? name : phoneNumber}: ${msg.body}`);
        
        await insertLead(phoneNumber, name);
    } catch (error) {
        console.error('Error handling incoming message:', error);
    }
}
