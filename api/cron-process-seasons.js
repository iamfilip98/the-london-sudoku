const { processSeasonEnd, createNewSeasons } = require('../lib/league-seasons');

/**
 * Cron job: Process league seasons weekly
 *
 * Called every Sunday at 23:59 UTC to:
 * 1. Close current seasons
 * 2. Calculate final rankings
 * 3. Promote/demote users
 * 4. Create new seasons for the next week
 *
 * Scheduled via vercel.json cron configuration
 */

module.exports = async function handler(req, res) {
    // Verify this is a cron request from Vercel
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('Unauthorized cron request');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('Starting weekly league season processing...');

        // Step 1: Process current season end (promote/demote/reset)
        console.log('Step 1: Processing season end...');
        const processResult = await processSeasonEnd();

        if (!processResult.success) {
            throw new Error('Season processing failed');
        }

        console.log('Season processing results:', processResult);

        // Step 2: Create new seasons for next week
        console.log('Step 2: Creating new seasons...');
        const newSeasons = await createNewSeasons();

        console.log(`Created ${newSeasons.length} new seasons`);

        // Return success
        return res.status(200).json({
            success: true,
            message: 'Weekly season processing completed',
            results: {
                seasonsProcessed: processResult.seasonsProcessed,
                promoted: processResult.promoted,
                demoted: processResult.demoted,
                stayed: processResult.stayed,
                newSeasonsCreated: newSeasons.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Weekly season processing failed:', error);
        return res.status(500).json({
            error: 'Season processing failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
