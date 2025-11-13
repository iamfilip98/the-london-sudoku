#!/bin/bash

# Transform pattern 5: Total days achievement - should return all players who participated
sed -i "s/return allEntries.length >= req.value ? \['faidao', 'filip'\] : \[\];/\/\/ Return all players who have participated in enough entries\n                const participatingPlayers = new Set();\n                allEntries.forEach(entry => {\n                    Object.keys(entry).filter(k => typeof entry[k] === 'object' \&\& entry[k].times).forEach(p => participatingPlayers.add(p));\n                });\n                return allEntries.length >= req.value ? Array.from(participatingPlayers) : [];/g" js/achievements.js

# Transform pattern 6: Async player loops - make dynamic
sed -i "s/for (const player of \['faidao', 'filip'\]) {/\/\/ Check all players dynamically\n        const allPlayers = await this.getAllPlayers();\n        for (const player of allPlayers) {/g" js/achievements.js

# Transform pattern 7: Comeback win - remove competitive logic, make personal
sed -i "s/const latestFaidaoWon = latestEntry.faidao.scores.total > latestEntry.filip.scores.total;/\/\/ For personal milestones, check if user completed all 3 puzzles after a period of DNFs\n        const players = [];\n        Object.keys(latestEntry).filter(k => typeof latestEntry[k] === 'object').forEach(player => {/g" js/achievements.js
sed -i "/const latestFilipWon = latestEntry.filip.scores.total > latestEntry.faidao.scores.total;/d" js/achievements.js

# Transform pattern 8: Weekend sweep comparisons - remove
sed -i "s/if (saturdayEntry.faidao.scores.total > saturdayEntry.filip.scores.total \&\&/\/\/ Check if player completed both weekend days\n        Object.keys(saturdayEntry).filter(k => typeof saturdayEntry[k] === 'object').forEach(player => {\n            const completedSat = saturdayEntry[player]?.scores?.total > 0;\n            const completedSun = sundayEntry[player]?.scores?.total > 0;\n            if (completedSat \&\&/g" js/achievements.js

# Transform pattern 9: Score diff (close win) - remove comparison
sed -i "s/const scoreDiff = Math.abs(entry.faidao.scores.total - entry.filip.scores.total);/\/\/ For personal milestones, check if user hit exact score threshold\n        const players = [];/g" js/achievements.js

# Transform pattern 10: Dominating win - change to high score threshold
sed -i "s/if (entry.faidao.scores.total >= entry.filip.scores.total \* req.value) {/\/\/ Check if player achieved dominating score (high threshold)\n        Object.keys(entry).filter(k => typeof entry[k] === 'object').forEach(player => {\n            if (entry[player]?.scores?.total >= req.value \* 1000) { \/\/ High score threshold/g" js/achievements.js

echo "Phase 2 transformation complete"
