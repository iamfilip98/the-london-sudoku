/**
 * Achievement Verification Script
 * Validates the new achievements JSON file for correctness
 */

const fs = require('fs');
const path = require('path');

const achievementsFile = path.join(__dirname, '../docs/NEW_ACHIEVEMENTS_PHASE3.json');

// Load achievements
const data = JSON.parse(fs.readFileSync(achievementsFile, 'utf8'));
const achievements = data.achievements;

console.log('🔍 Verifying New Achievements Phase 3...\n');

// Track results
const errors = [];
const warnings = [];
const stats = {
  total: achievements.length,
  byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 },
  byType: {},
  totalXP: 0,
  ids: new Set(),
  duplicateIds: []
};

// Required fields
const requiredFields = ['id', 'title', 'description', 'icon', 'type', 'rarity', 'xp', 'requirement'];

// Validate each achievement
achievements.forEach((ach, index) => {
  // Check required fields
  requiredFields.forEach(field => {
    if (!ach[field]) {
      errors.push(`Achievement #${index + 1}: Missing required field '${field}'`);
    }
  });

  // Check ID uniqueness
  if (ach.id) {
    if (stats.ids.has(ach.id)) {
      errors.push(`Duplicate ID found: ${ach.id}`);
      stats.duplicateIds.push(ach.id);
    }
    stats.ids.add(ach.id);
  }

  // Check rarity
  if (ach.rarity && !['common', 'rare', 'epic', 'legendary'].includes(ach.rarity)) {
    errors.push(`Achievement '${ach.id}': Invalid rarity '${ach.rarity}'`);
  } else if (ach.rarity) {
    stats.byRarity[ach.rarity]++;
  }

  // Check XP
  if (ach.xp) {
    stats.totalXP += ach.xp;

    // Validate XP matches rarity guidelines
    if (ach.rarity === 'common' && (ach.xp < 10 || ach.xp > 25)) {
      warnings.push(`Achievement '${ach.id}': XP ${ach.xp} unusual for common rarity (expected 10-25)`);
    }
    if (ach.rarity === 'rare' && (ach.xp < 15 || ach.xp > 40)) {
      warnings.push(`Achievement '${ach.id}': XP ${ach.xp} unusual for rare rarity (expected 15-40)`);
    }
    if (ach.rarity === 'epic' && (ach.xp < 30 || ach.xp > 75)) {
      warnings.push(`Achievement '${ach.id}': XP ${ach.xp} unusual for epic rarity (expected 30-75)`);
    }
    if (ach.rarity === 'legendary' && (ach.xp < 75 || ach.xp > 200)) {
      warnings.push(`Achievement '${ach.id}': XP ${ach.xp} unusual for legendary rarity (expected 75-200)`);
    }
  }

  // Count by type
  if (ach.type) {
    stats.byType[ach.type] = (stats.byType[ach.type] || 0) + 1;
  }

  // Check icon format
  if (ach.icon && !ach.icon.startsWith('fa-')) {
    warnings.push(`Achievement '${ach.id}': Icon '${ach.icon}' should start with 'fa-'`);
  }

  // Check requirement structure
  if (ach.requirement && !ach.requirement.type) {
    errors.push(`Achievement '${ach.id}': Requirement missing 'type' field`);
  }
});

// Print results
console.log('📊 Statistics:');
console.log(`   Total Achievements: ${stats.total}`);
console.log(`   Unique IDs: ${stats.ids.size}`);
console.log(`   Total XP Available: ${stats.totalXP}`);
console.log('');

console.log('🎨 Rarity Distribution:');
Object.entries(stats.byRarity).forEach(([rarity, count]) => {
  const percentage = ((count / stats.total) * 100).toFixed(1);
  console.log(`   ${rarity.charAt(0).toUpperCase() + rarity.slice(1).padEnd(10)}: ${count.toString().padStart(3)} (${percentage}%)`);
});
console.log('');

console.log('📂 Type Distribution:');
Object.entries(stats.byType).forEach(([type, count]) => {
  console.log(`   ${type.padEnd(15)}: ${count}`);
});
console.log('');

// Print errors
if (errors.length > 0) {
  console.log('❌ ERRORS FOUND:');
  errors.forEach(err => console.log(`   - ${err}`));
  console.log('');
}

// Print warnings
if (warnings.length > 0 && warnings.length <= 10) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(`   - ${warn}`));
  console.log('');
}

// Final verdict
if (errors.length === 0) {
  console.log('✅ All validations passed!');
  console.log(`✅ ${stats.total} achievements ready for implementation`);
  console.log(`✅ ${stats.totalXP} total XP available`);
  console.log('');

  // Compare with expected
  if (stats.total === 110) {
    console.log('✅ Achievement count matches target (110)');
  } else {
    console.log(`⚠️  Achievement count is ${stats.total}, expected 110`);
  }

  if (stats.totalXP === data.statistics.total_xp_available) {
    console.log('✅ Total XP matches metadata');
  } else {
    console.log(`⚠️  Total XP (${stats.totalXP}) doesn't match metadata (${data.statistics.total_xp_available})`);
  }

  process.exit(0);
} else {
  console.log(`❌ Validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
