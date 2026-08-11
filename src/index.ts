import { initDb } from './db';
import { initializeWhatsAppClient, whatsappClient } from './services/whatsapp';

async function bootstrap() {
    try {
        console.log('Initializing database...');
        await initDb();

        console.log('Initializing WhatsApp client...');
        initializeWhatsAppClient();

        // Handle graceful shutdown to prevent zombie browser processes
        process.on('SIGINT', async () => {
            console.log('\nGracefully shutting down WhatsApp client...');
            try {
                await whatsappClient.destroy();
                console.log('WhatsApp client destroyed.');
            } catch (err) {
                console.error('Error destroying client:', err);
            }
            process.exit(0);
        });
    } catch (error) {
        console.error('Fatal error during bootstrap:', error);
        process.exit(1);
    }
}

bootstrap();
