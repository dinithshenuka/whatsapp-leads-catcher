import { Message } from 'whatsapp-web.js';
import { insertLead } from '../database/leads';

export async function handleIncomingMessage(msg: Message): Promise<void> {
    try {
        const contact = await msg.getContact();
        const phoneNumber = contact.number ? `+${contact.number}` : `+${msg.from.split('@')[0]}`;
        const name = contact.name || contact.pushname || null;

        // Skip status broadcasts
        if (phoneNumber === '+status') return;

        console.log(`Received message from ${name ? name : phoneNumber}: ${msg.body}`);
        
        await insertLead(phoneNumber, name);
    } catch (error) {
        console.error('Error handling incoming message:', error);
    }
}
