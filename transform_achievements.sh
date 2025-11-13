#!/bin/bash

# Backup
cp js/achievements.js js/achievements.js.bak

# Transform pattern 1: Replace hardcoded player arrays with dynamic detection from entry
sed -i "s/const players = \['faidao', 'filip'\];/\/\/ Check all players in entry dynamically\n        const players = Object.keys(entry).filter(key => typeof entry[key] === 'object' \&\& entry[key].times);/g" js/achievements.js

# Transform pattern 2: Streaks - make generic
sed -i "s/if ((streaks.faidao?.current || 0) >= requiredStreak) players.push('faidao');/\/\/ Check streaks for all players\n        Object.keys(streaks).forEach(player => {\n            if ((streaks[player]?.current || 0) >= requiredStreak) players.push(player);\n        });/g" js/achievements.js
sed -i "/if ((streaks.filip?.current || 0) >= requiredStreak) players.push('filip');/d" js/achievements.js

# Transform pattern 3: Daily score comparisons - remove dual player checks
sed -i "s/if (entry.faidao.scores.total >= requiredScore) players.push('faidao');/\/\/ Check score for all players in entry\n        Object.keys(entry).forEach(player => {\n            if (entry[player]?.scores?.total >= requiredScore) players.push(player);\n        });/g" js/achievements.js
sed -i "/if (entry.filip.scores.total >= requiredScore) players.push('filip');/d" js/achievements.js

# Transform pattern 4: Weekend sweep - remove competitive comparisons
sed -i "s/const faidaoWins = weekEntries.filter(e => e.faidao.scores.total > e.filip.scores.total).length;/\/\/ For personal milestones, check if user completed all weekend puzzles\n                const playerCompletions = {};\n                weekEntries.forEach(e => {\n                    Object.keys(e).filter(k => typeof e[k] === 'object' \&\& e[k].scores).forEach(player => {\n                        playerCompletions[player] = (playerCompletions[player] || 0) + 1;\n                    });\n                });/g" js/achievements.js
sed -i "/const filipWins = weekEntries.filter(e => e.filip.scores.total > e.faidao.scores.total).length;/d" js/achievements.js
sed -i "s/if (faidaoWins === 7) return \['faidao'\];/\/\/ Return players who completed all 7 days\n                return Object.keys(playerCompletions).filter(p => playerCompletions[p] === 7);/g" js/achievements.js
sed -i "/if (filipWins === 7) return \['filip'\];/d" js/achievements.js

echo "Transformation complete. Review js/achievements.js"
