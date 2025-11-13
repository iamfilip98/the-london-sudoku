#!/bin/bash

# Transform pattern 11: Remaining comeback logic
sed -i "s/const hasLossStreak = previousEntries.every(entry => entry.filip.scores.total > entry.faidao.scores.total);/const hadLowScores = previousEntries.every(e => Object.keys(e).some(p => e[p]?.scores?.total < 500));/g" js/achievements.js
sed -i "s/return hasLossStreak ? \['faidao'\] : \[\];/if (hadLowScores \&\& Object.keys(latestEntry).some(p => latestEntry[p]?.scores?.total > 1000)) {\n                    Object.keys(latestEntry).filter(k => typeof latestEntry[k] === 'object').forEach(p => players.push(p));\n                }\n            });\n        });\n        return players;/g" js/achievements.js
sed -i "/const hasLossStreak = previousEntries.every(entry => entry.faidao.scores.total > entry.filip.scores.total);/d" js/achievements.js
sed -i "/return hasLossStreak ? \['filip'\] : \[\];/d" js/achievements.js

# Transform pattern 12: Weekend completion logic - finish transformation
sed -i "s/sundayEntry.faidao.scores.total > sundayEntry.filip.scores.total) {/completedSun) {/g" js/achievements.js
sed -i "/players.push('faidao');/d" js/achievements.js
sed -i "s/if (saturdayEntry.filip.scores.total > saturdayEntry.faidao.scores.total \&\&/\/\/ Already handled above/g" js/achievements.js
sed -i "/sundayEntry.filip.scores.total > sundayEntry.faidao.scores.total) {/d" js/achievements.js
sed -i "/players.push('filip');/d" js/achievements.js

# Transform pattern 13: Close win - make personal
sed -i "s/if (entry.faidao.scores.total > entry.filip.scores.total) return \['faidao'\];/\/\/ For personal milestones, check if user hit specific thresholds\n        Object.keys(entry).filter(k => typeof entry[k] === 'object').forEach(player => {\n            if (entry[player]?.scores?.total === req.value) players.push(player);\n        });\n        return players;/g" js/achievements.js
sed -i "/if (entry.filip.scores.total > entry.faidao.scores.total) return \['filip'\];/d" js/achievements.js

# Transform pattern 14: Dominating score remnants
sed -i "/if (entry.filip.scores.total >= entry.faidao.scores.total \* req.value) {/d" js/achievements.js

# Transform pattern 15: Winner determination in balanced times
sed -i "s/const isWinner = entry\[player\].scores.total > entry\[player === 'faidao' ? 'filip' : 'faidao'\].scores.total;/\/\/ For personal milestones, check if completed all puzzles\n            const completedAll = ['easy', 'medium', 'hard'].every(d => entry[player].times[d] !== null);/g" js/achievements.js

# Transform pattern 16: UI display - make generic
sed -i "s/faidao: 0,/\/\/ Dynamic player counts/g" js/achievements.js
sed -i "/filip: 0/d" js/achievements.js
sed -i "s/const faidaoCountEl = document.getElementById('faidaoAchievementCount');/\/\/ Update achievement counts for all players dynamically/g" js/achievements.js
sed -i "/const filipCountEl = document.getElementById('filipAchievementCount');/d" js/achievements.js
sed -i "s/if (faidaoCountEl) faidaoCountEl.textContent = playerCounts.faidao;/Object.keys(playerCounts).forEach(player => {\n            const countEl = document.getElementById(player + 'AchievementCount');\n            if (countEl) countEl.textContent = playerCounts[player];\n        });/g" js/achievements.js
sed -i "/if (filipCountEl) filipCountEl.textContent = playerCounts.filip;/d" js/achievements.js

echo "Final transformation complete"
