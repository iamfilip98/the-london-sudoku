/**
 * Ad Manager for Google AdSense Integration
 *
 * Phase 1 Month 6: Monetization via ads for free tier users
 *
 * Features:
 * - Banner ads (non-intrusive placement)
 * - Rewarded video ads (max 3/day for extra hints/lives)
 * - Premium user detection (ad-free experience)
 * - Ad block detection with polite request
 *
 * Usage:
 *   const adManager = new AdManager();
 *   await adManager.init();
 *   adManager.showBannerAd('ad-container-id');
 *   await adManager.showRewardedVideo();
 */

class AdManager {
    constructor() {
        this.adsEnabled = false;
        this.isPremium = false;
        this.rewardedVideosWatchedToday = 0;
        this.maxRewardedVideosPerDay = 3;
        this.adBlockDetected = false;

        // Google AdSense configuration
        this.adSenseClientId = 'ca-pub-XXXXXXXXXX'; // TODO: Replace with actual AdSense ID
        this.adSenseSlots = {
            banner: 'XXXXXXXXXX', // TODO: Replace with actual slot ID
            sidebar: 'XXXXXXXXXX'
        };
    }

    /**
     * Initialize ad system
     * - Check if user is premium
     * - Detect ad blockers
     * - Load AdSense script
     */
    async init() {
        console.log('🎯 Initializing Ad Manager...');

        // Check premium status from user session
        await this.checkPremiumStatus();

        if (this.isPremium) {
            console.log('✅ Premium user - ads disabled');
            this.adsEnabled = false;
            return;
        }

        // Detect ad blocker
        this.adBlockDetected = await this.detectAdBlock();

        if (this.adBlockDetected) {
            console.log('⚠️ Ad blocker detected');
            this.showAdBlockMessage();
            return;
        }

        // Load rewarded video count from localStorage
        this.loadRewardedVideoCount();

        // Load Google AdSense
        await this.loadAdSenseScript();

        this.adsEnabled = true;
        console.log('✅ Ad Manager initialized');
    }

    /**
     * Check if current user has premium subscription
     */
    async checkPremiumStatus() {
        try {
            const username = sessionStorage.getItem('playerName');
            if (!username) {
                this.isPremium = false;
                return;
            }

            // TODO: Add premium field to users table
            // For now, assume all users are free tier
            this.isPremium = false;

            // const response = await fetch(`/api/auth?username=${username}`);
            // const data = await response.json();
            // this.isPremium = data.profile?.premium || false;
        } catch (error) {
            console.error('Failed to check premium status:', error);
            this.isPremium = false;
        }
    }

    /**
     * Detect ad blocker presence
     */
    async detectAdBlock() {
        try {
            // Create a bait element that ad blockers typically block
            const bait = document.createElement('div');
            bait.className = 'adsbox ad-banner ad-placement';
            bait.style.cssText = 'position:absolute;width:1px;height:1px;top:-10px;left:-10px;';
            document.body.appendChild(bait);

            await new Promise(resolve => setTimeout(resolve, 100));

            const detected = bait.offsetHeight === 0 ||
                           bait.offsetWidth === 0 ||
                           window.getComputedStyle(bait).display === 'none';

            document.body.removeChild(bait);
            return detected;
        } catch (error) {
            return false;
        }
    }

    /**
     * Show polite ad block message (non-intrusive)
     */
    showAdBlockMessage() {
        const message = document.createElement('div');
        message.className = 'ad-block-notice';
        message.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 235, 59, 0.95);
                color: #000;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                max-width: 320px;
                z-index: 9999;
                font-size: 14px;
                line-height: 1.5;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <i class="fas fa-ad" style="margin-right: 10px; font-size: 18px;"></i>
                    <strong>Ad Blocker Detected</strong>
                </div>
                <p style="margin: 0 0 10px 0;">
                    We noticed you're using an ad blocker. Ads help keep The London Sudoku free!
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">
                    Consider upgrading to <strong>Premium</strong> ($4.99/mo) for an ad-free experience.
                </p>
                <button onclick="this.parentElement.remove()" style="
                    margin-top: 10px;
                    padding: 6px 12px;
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Got it</button>
            </div>
        `;
        document.body.appendChild(message);

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 10000);
    }

    /**
     * Load Google AdSense script
     */
    async loadAdSenseScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.adsbygoogle) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adSenseClientId}`;
            script.async = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                console.log('✅ AdSense script loaded');
                resolve();
            };

            script.onerror = () => {
                console.error('❌ Failed to load AdSense script');
                reject(new Error('AdSense script failed to load'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Show banner ad in specified container
     */
    showBannerAd(containerId, slot = 'banner') {
        if (!this.adsEnabled || this.isPremium) {
            console.log('Ads disabled - not showing banner');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Create AdSense ad unit
        const adHTML = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="${this.adSenseClientId}"
                 data-ad-slot="${this.adSenseSlots[slot]}"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;

        container.innerHTML = adHTML;

        // Push ad to AdSense queue
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log(`✅ Banner ad requested for ${containerId}`);
        } catch (error) {
            console.error('Failed to show banner ad:', error);
        }
    }

    /**
     * Show rewarded video ad
     * Returns: Promise<boolean> - true if reward should be granted
     */
    async showRewardedVideo() {
        if (!this.adsEnabled || this.isPremium) {
            console.log('Ads disabled - not showing rewarded video');
            return false;
        }

        // Check daily limit
        if (this.rewardedVideosWatchedToday >= this.maxRewardedVideosPerDay) {
            this.showRewardedVideoLimitMessage();
            return false;
        }

        // TODO: Integrate actual rewarded video provider (e.g., AdMob SDK for web)
        // For now, show a placeholder modal
        const watched = await this.showRewardedVideoPlaceholder();

        if (watched) {
            this.rewardedVideosWatchedToday++;
            this.saveRewardedVideoCount();
            return true;
        }

        return false;
    }

    /**
     * Show rewarded video placeholder (demo mode)
     */
    async showRewardedVideoPlaceholder() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'rewarded-video-modal';
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                ">
                    <div style="
                        background: #fff;
                        padding: 30px;
                        border-radius: 12px;
                        max-width: 400px;
                        text-align: center;
                    ">
                        <div style="font-size: 48px; margin-bottom: 20px;">📺</div>
                        <h3 style="margin: 0 0 15px 0;">Watch Video Ad</h3>
                        <p style="color: #666; margin-bottom: 20px;">
                            Watch a short video to earn a free hint!
                        </p>
                        <p style="font-size: 14px; color: #999; margin-bottom: 20px;">
                            Remaining today: ${this.maxRewardedVideosPerDay - this.rewardedVideosWatchedToday}/3
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="watchAdBtn" style="
                                padding: 12px 24px;
                                background: #4CAF50;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: bold;
                            ">Watch Ad (Demo)</button>
                            <button id="cancelAdBtn" style="
                                padding: 12px 24px;
                                background: #ccc;
                                color: #333;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 16px;
                            ">Cancel</button>
                        </div>
                        <p style="font-size: 12px; color: #999; margin-top: 15px;">
                            🎁 Upgrade to <strong>Premium</strong> for unlimited hints!
                        </p>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('watchAdBtn').onclick = () => {
                modal.remove();
                resolve(true);
            };

            document.getElementById('cancelAdBtn').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    /**
     * Show message when daily rewarded video limit reached
     */
    showRewardedVideoLimitMessage() {
        alert('You\'ve watched the maximum number of reward videos today (3/3).\n\nUpgrade to Premium for unlimited hints!');
    }

    /**
     * Load rewarded video count from localStorage
     */
    loadRewardedVideoCount() {
        const today = new Date().toISOString().split('T')[0];
        const data = localStorage.getItem('rewarded_videos');

        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.date === today) {
                this.rewardedVideosWatchedToday = parsed.count;
            } else {
                this.rewardedVideosWatchedToday = 0;
            }
        }
    }

    /**
     * Save rewarded video count to localStorage
     */
    saveRewardedVideoCount() {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('rewarded_videos', JSON.stringify({
            date: today,
            count: this.rewardedVideosWatchedToday
        }));
    }

    /**
     * Get remaining rewarded videos for today
     */
    getRemainingRewardedVideos() {
        return Math.max(0, this.maxRewardedVideosPerDay - this.rewardedVideosWatchedToday);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdManager;
}
