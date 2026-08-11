import inquirer from 'inquirer';
import { initializeWhatsAppClient, runHistoricalScraper, whatsappClient } from './services/whatsapp';
import { printLeadsTable } from './database/leads';

export async function showMenu() {
    console.log('\n=======================================');
    console.log('   WhatsApp Leads Catcher CLI');
    console.log('=======================================\n');

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: 'Start WhatsApp Bot', value: 'start_bot' },
                { name: 'Scrape Historical Leads', value: 'scrape_leads' },
                { name: 'View All Leads', value: 'view_leads' },
                { name: 'View Leads by Time Period', value: 'view_leads_period' },
                { name: 'Exit', value: 'exit' }
            ]
        }
    ]);

    switch (action) {
        case 'start_bot':
            console.log('\nInitializing WhatsApp client...');
            initializeWhatsAppClient();
            // We won't re-show the menu immediately because the bot is running in the foreground now.
            break;
            
        case 'scrape_leads':
            const { scrapePeriod } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'scrapePeriod',
                    message: 'Select time period to scrape:',
                    choices: [
                        { name: 'Last 24 Hours', value: '1' },
                        { name: 'Last 7 Days', value: '7' },
                        { name: 'Last 30 Days', value: '30' },
                        { name: 'All Time', value: 'all' }
                    ]
                }
            ]);
            
            console.log('\nInitializing WhatsApp client for scraping...');
            const daysToScrape = scrapePeriod === 'all' ? null : parseInt(scrapePeriod);
            try {
                await runHistoricalScraper(daysToScrape);
                console.log('\nScraping complete. Shutting down client...');
                await whatsappClient.destroy();
            } catch (err) {
                console.error('\nScraping failed:', err);
                try { await whatsappClient.destroy(); } catch(e) {}
            }
            
            console.log('\n');
            await showMenu();
            break;

            
        case 'view_leads':
            await printLeadsTable();
            // Show menu again after viewing
            console.log('\n');
            await showMenu();
            break;
            
        case 'view_leads_period':
            const { period } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'period',
                    message: 'Select time period:',
                    choices: [
                        { name: 'Last 24 Hours', value: '1' },
                        { name: 'Last 7 Days', value: '7' },
                        { name: 'Last 30 Days', value: '30' }
                    ]
                }
            ]);
            await printLeadsTable(parseInt(period));
            // Show menu again after viewing
            console.log('\n');
            await showMenu();
            break;
            
        case 'exit':
            console.log('Goodbye!');
            // If the client is initialized, destroy it to clean up Puppeteer
            try {
                await whatsappClient.destroy();
            } catch (e) {
                // Ignore if it wasn't initialized yet
            }
            process.exit(0);
            break;
    }
}
