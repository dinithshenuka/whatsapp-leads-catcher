import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { ENV } from '../config/env';
import { handleIncomingMessage } from '../handlers/message';
import { insertLead } from '../database/leads';

export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: ENV.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

whatsappClient.on('disconnected', (reason) => {
    console.error('\n[!] WhatsApp Client was disconnected! Reason:', reason);
    console.error('[!] If you were logged out, you may need to restart the CLI to scan a new QR code.\n');
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
                    const phoneNumber = contact.number ? `+${contact.number}` : (chat.id.user ? `+${chat.id.user}` : null);
                    const name = contact.name || contact.pushname || chat.name || null;
                    if (phoneNumber && phoneNumber !== '+status') {
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

export async function runHistoricalScraper(days: number | null): Promise<void> {
    return new Promise((resolve, reject) => {
        whatsappClient.on('qr', (qr: string) => {
            console.log('Please scan the QR code below to authenticate:');
            qrcode.generate(qr, { small: true });
        });

        const performScraping = async () => {
            console.log('WhatsApp Client is ready! Preparing to scrape historical leads...');
            try {
                const page = whatsappClient.pupPage;
                if (!page) {
                    throw new Error("Puppeteer page not found. Make sure client is fully initialized.");
                }

                console.log('Automating browser to load historical chats (this may take a minute)...');
                
                // Inject the auto-scrolling script as a string to avoid esbuild/tsx transpilation issues (__name is not defined)
                await page.evaluate(`(async () => {
                    const chatList = document.querySelector('#pane-side');
                    if (!chatList) return;
                    
                    let lastCount = 0;
                    let currentCount = 0;
                    
                    do {
                        lastCount = currentCount;
                        chatList.scrollTop = chatList.scrollHeight;
                        
                        // Wait for network/rendering
                        await new Promise(r => setTimeout(r, 1200));
                        
                        currentCount = chatList.querySelectorAll('div[role="listitem"]').length;
                    } while (currentCount > lastCount);
                })()`);

                console.log('Auto-scrolling complete. Extracting leads safely...');

                const extractionResult = await page.evaluate(() => {
                    try {
                        // @ts-ignore
                        const chatModels = window.require('WAWebCollections').Chat.getModelsArray();
                        
                        const leads = chatModels.map((chat: any) => {
                            if (chat.isGroup) return null;
                            
                            let phoneNumber = null;
                            if (chat.contact && chat.contact.userid) {
                                phoneNumber = '+' + chat.contact.userid;
                            } else if (chat.id && chat.id.user) {
                                phoneNumber = '+' + chat.id.user;
                            }
                            
                            let name = chat.name || chat.formattedTitle || chat.pushname || null;
                            
                            return {
                                phoneNumber,
                                name,
                                timestamp: chat.t || 0
                            };
                        }).filter((c: any) => c !== null && c.phoneNumber !== null && c.phoneNumber !== '+status');
                        
                        return { success: true, modelsCount: chatModels.length, leads };
                    } catch (e: any) {
                        return { success: false, error: e.toString(), modelsCount: 0, leads: [] };
                    }
                });

                console.log('Extraction Debug:', {
                    success: extractionResult.success,
                    error: extractionResult.error,
                    totalModels: extractionResult.modelsCount,
                    validLeads: extractionResult.leads.length
                });

                const rawLeads = extractionResult.leads;
                console.log(`Initial extraction found ${rawLeads.length} individual chats. Filtering...`);
                
                let count = 0;
                const cutoffTime = days ? Date.now() - (days * 24 * 60 * 60 * 1000) : 0;

                for (const lead of rawLeads) {
                    const chatTimeMs = lead.timestamp * 1000;
                    if (days && chatTimeMs < cutoffTime) {
                        continue;
                    }
                    
                    await insertLead(lead.phoneNumber, lead.name);
                    count++;
                }
                console.log(`Successfully scraped historical chats. Found ${count} leads matching criteria.`);
                resolve();
            } catch (error) {
                console.error('Error scraping historical leads:', error);
                reject(error);
            }
        };

        whatsappClient.on('authenticated', () => {
            console.log('Authenticated successfully!');
        });
        
        whatsappClient.on('auth_failure', (msg) => {
            console.error('Authentication failure:', msg);
        });

        whatsappClient.on('loading_screen', (percent, message) => {
            console.log(`Loading... ${percent}% - ${message}`);
        });

        console.log('Starting WhatsApp client initialization...');
        whatsappClient.initialize().then(async () => {
            console.log('Browser launched. Waiting for WhatsApp chat interface to load...');
            const page = whatsappClient.pupPage;
            if (page) {
                try {
                    // Manually wait for the chat list to appear, bypassing the flaky 'ready' event
                    // Increased timeout to 120s as WhatsApp Web synchronization can sometimes take longer.
                    await page.waitForSelector('#pane-side', { timeout: 120000 });
                    await performScraping();
                } catch (err) {
                    console.error('Timed out waiting for WhatsApp UI to load. Is it stuck on a loading screen?');
                    reject(err);
                }
            } else {
                reject(new Error("Puppeteer page not found."));
            }
        }).catch((err: Error) => {
            console.error('Failed to initialize WhatsApp client:', err);
            reject(err);
        });
    });
}
