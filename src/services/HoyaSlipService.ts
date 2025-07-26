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

    private async simulateMouseMovement(element: any): Promise<void> {
        if (!this.page) return;
        
        // Get the element's bounding box
        const box = await element.boundingBox();
        if (!box) return;

        // Get current viewport size
        const viewport = await this.page.viewportSize();
        if (!viewport) return;

        // Start from a random position in the viewport
        const startX = Math.random() * viewport.width;
        const startY = Math.random() * viewport.height;
        
        // Calculate target position (center of element)
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;

        // Generate control points for bezier curve
        const cp1x = startX + (Math.random() * 200 - 100);
        const cp1y = startY + (Math.random() * 200 - 100);
        const cp2x = targetX + (Math.random() * 200 - 100);
        const cp2y = targetY + (Math.random() * 200 - 100);

        // Move mouse along bezier curve
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.pow(1 - t, 3) * startX + 
                     3 * Math.pow(1 - t, 2) * t * cp1x + 
                     3 * (1 - t) * Math.pow(t, 2) * cp2x + 
                     Math.pow(t, 3) * targetX;
            const y = Math.pow(1 - t, 3) * startY + 
                     3 * Math.pow(1 - t, 2) * t * cp1y + 
                     3 * (1 - t) * Math.pow(t, 2) * cp2y + 
                     Math.pow(t, 3) * targetY;
            
            await this.page.mouse.move(x, y);
            
            // Add small random delays
            if (Math.random() < 0.2) {
                await this.page.waitForTimeout(Math.random() * 100);
            }
        }

        // Final precise movement to target
        await this.page.mouse.move(targetX, targetY);
    }

    private async initBrowser(): Promise<void> {
        try {
            this.browser = await chromium.launch({
                headless: true,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--window-size=1920,1080'
                ]
            });

            const context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false,
                locale: 'zh-TW',
                timezoneId: 'Asia/Taipei',
                permissions: ['geolocation']
            });

            // Mask automation fingerprints
            await context.addInitScript(() => {
                // Override navigator properties
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { 
                    get: () => [
                        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                        { name: 'Native Client', filename: 'internal-nacl-plugin' }
                    ]
                });
                Object.defineProperty(navigator, 'languages', { get: () => ['zh-TW', 'zh', 'en-US', 'en'] });
                
                // Add WebGL fingerprint
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) {
                        return 'Intel Inc.'
                    }
                    if (parameter === 37446) {
                        return 'Intel(R) Iris(TM) Plus Graphics'
                    }
                    return getParameter.apply(this, [parameter]);
                };
            });

            this.page = await context.newPage();
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
            // Add mouse movement and click before typing
            await this.simulateMouseMovement(loginAccount);
            await this.page.waitForTimeout(500);
            await loginAccount.click();
            await this.page.waitForTimeout(300);
            await loginAccount.pressSequentially(this.config.account, { delay: 100 });
            await this.page.waitForTimeout(1000);

            const loginPassword = this.page.locator('#password');
            // Add mouse movement and click before typing password
            await this.simulateMouseMovement(loginPassword);
            await this.page.waitForTimeout(500);
            await loginPassword.click();
            await this.page.waitForTimeout(300);
            await loginPassword.pressSequentially(this.config.password, { delay: 100 });
            await this.page.waitForTimeout(2000);

            // Add mouse movement before clicking login button
            const loginButton = this.page.locator('section').filter({ hasText: '登入' }).getByRole('button');
            await this.simulateMouseMovement(loginButton);
            await this.page.waitForTimeout(500); // Small pause after movement
            await loginButton.click();
            logger.info('Login button clicked');

            await this.page.waitForTimeout(3000);
            const authCode = this.generateAuthCode();
            for (let i = 0; i < 6; i++) {
                await this.page.getByTestId(`verify-input-${i}`).fill(authCode[i].toString());
            }
            logger.info('Auth code filled');
            // return;
            await this.page.waitForTimeout(3000);
            await this.page.goto(`${this.config.baseUrl}/trade-convert`);
            await this.page.waitForTimeout(2000);
            await this.page.getByPlaceholder('請輸入數額').click();
            await this.page.waitForTimeout(1000);
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