import { initDb } from './database';
import { initializeWhatsAppClient, whatsappClient } from './services/whatsapp';
import { showMenu } from './cli';

async function bootstrap() {
    try {
        console.log('Initializing database...');
        await initDb();

        console.log('Launching interactive menu...');
        await showMenu();

        // Ignore unhandled puppeteer TargetCloseErrors that happen during teardown
        process.on('unhandledRejection', (reason: any) => {
            if (reason && reason.name === 'TargetCloseError') {
                return;
            }
            console.error('Unhandled Rejection:', reason);
        });

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
