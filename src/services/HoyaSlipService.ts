import { Service } from 'typedi';
import { logger } from '../utils/logger.js';
import { authenticator } from 'otplib';
import { chromium, Browser, Page } from 'playwright';
import { HoyaApiConfig } from '../config/HoyaApiConfig.js';

@Service()
export class HoyaSlipService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    constructor(
        private readonly config: HoyaApiConfig
    ) {}

    private generateAuthCode(): string {
        try {
            return authenticator.generate(this.config.googleAuthKey);
        } catch (error) {
            logger.error('Failed to generate Google Authentication code:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    private async captureScreenshot(errorContext: string): Promise<void> {
        if (!this.page) return;
        
        try {
            // Capture screenshot as base64
            const screenshot = await this.page.screenshot({ 
                type: 'png',
                fullPage: true
            }).then(buffer => buffer.toString('base64'));
            
            logger.error(`Screenshot for ${errorContext}:
=== BEGIN SCREENSHOT ===
data:image/png;base64,${screenshot}
=== END SCREENSHOT ===`);
        } catch (screenshotError) {
            logger.error('Failed to capture error screenshot:', screenshotError instanceof Error ? screenshotError.message : 'Unknown error');
        }
    }

    private async handleError(error: unknown, context: string): Promise<never> {
        await this.captureScreenshot(context);
        logger.error(`${context}:`, error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }

    private async initBrowser(): Promise<void> {
        try {
            this.browser = await chromium.launch({
                headless: true // set to false for local debugging to open browser
            });
            this.page = await this.browser.newPage();
            logger.info('Browser initialized successfully');
        } catch (error) {
            await this.handleError(error, 'Failed to initialize browser');
        }
    }

    private async cleanup(): Promise<void> {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            logger.info('Browser cleanup completed');
        } catch (error) {
            logger.error('Failed to cleanup browser:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    public async Do(): Promise<void> {
        logger.info('HoyaSlipService: Starting task');
        
        try {
            await this.initBrowser();
            if (!this.page) throw new Error('Browser page not initialized');

            await this.page.goto(`${this.config.baseUrl}/login`);
            await this.page.waitForTimeout(2000);
            logger.info('Go to Hoya login page');

            const loginAccount = this.page.locator('#account');
            loginAccount.fill(this.config.account);
            await this.page.waitForTimeout(1000);
            const loginPassword = this.page.locator('#password');
            loginPassword.fill(this.config.password);
            await this.page.locator('section').filter({ hasText: '登入' }).getByRole('button').click();
            logger.info('Login button clicked');

            await this.page.waitForTimeout(3000);
            const authCode = this.generateAuthCode();
            for (let i = 0; i < 6; i++) {
                await this.page.getByTestId(`verify-input-${i}`).fill(authCode[i].toString());
            }
            logger.info('Auth code filled');
            await this.page.waitForTimeout(3000);
            await this.page.goto(`${this.config.baseUrl}/trade-convert`);
            await this.page.waitForTimeout(2000);
            await this.page.getByPlaceholder('請輸入數額').pressSequentially('300', { delay: 100 });
            logger.info('Buy amount input filled');
            await this.page.getByRole('button', { name: '訂單預覽' }).click();
            await this.page.waitForTimeout(500);
            await this.page.getByRole('button', { name: '確認送出' }).click();
            await this.page.waitForTimeout(1000);
            logger.info('Buy order confirmed');

            await this.page.goto(`${this.config.baseUrl}/trade-convert`);
            await this.page.waitForTimeout(3000);

            await this.page.getByRole('tab', { name: '賣出' }).click();
            await this.page.waitForTimeout(500)
            await this.page.getByText('最大值').click();
            logger.info('Sell max amount selected');
            await this.page.getByRole('button', { name: '訂單預覽' }).click();
            await this.page.waitForTimeout(500);
            await this.page.getByRole('button', { name: '確認送出' }).click();
            logger.info('Sell order confirmed');
            await this.page.waitForTimeout(3000);

        } catch (error) {
            await this.handleError(error, 'HoyaSlipService execution failed');
        } finally {
            await this.cleanup();
        }
        
        logger.info('HoyaSlipService: Task completed');
    }
} 