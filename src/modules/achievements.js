const { EmbedBuilder } = require('discord.js');
const { getOrCreateUserAchievements, updateUserAchievements} = require('./db.js');

const ACHIEVEMENTS = {
    WEENFACT_ADDICT: {
        id: 'WEENFACT_ADDICT',
        name: 'weenfact addict',
        description: 'you are addicted to ween facts for whatever reason',
        requiredProgress: 20
    }
};

async function createAchievementEmbed(achievement, user) {
    const embed = new EmbedBuilder()
        .setTitle('🏆 achievement Unlocked!')
        .setDescription(`**${achievement.name}**\n${achievement.description}`)
        .setColor(0xFFD700) // gold color
        .setFooter({ text: `unlocked by ${user.username}` })
        .setTimestamp();

    return embed;
}

async function updateAchievementProgress(userId, achievementId, increment = 1, channel = null) {
    try {
        const userData = await getOrCreateUserAchievements(userId);
        const achievement = ACHIEVEMENTS[achievementId];
        
        if (!achievement) return null;

        const tracking = userData.achievement_tracking || {};
        const currentProgress = tracking[achievementId] || 0;
        const newProgress = currentProgress + increment;

        const newTracking = {
            ...tracking,
            [achievementId]: newProgress
        };

        let achievementUnlocked = null;
        if (newProgress >= achievement.requiredProgress && 
            !userData.achievements.includes(achievementId)) {
            achievementUnlocked = achievement;
            userData.achievements.push(achievementId);

            if (channel && achievementUnlocked) {
                try {
                    const user = await channel.client.users.fetch(userId);
                    const achievementEmbed = await createAchievementEmbed(achievementUnlocked, user);
                    await channel.send({ embeds: [achievementEmbed] });
                } catch (error) {
                    console.error('Error sending achievement notification:', error);
                }
            }
        }

        await updateUserAchievements(userId, userData.achievements, newTracking);
        return achievementUnlocked;
    } catch (err) {
        console.error('Error updating achievement progress:', err);
        return null;
    }
}

async function getUserAchievements(userId) {
    try {
        const userData = await getOrCreateUserAchievements(userId);
        return {
            unlocked: userData.achievements.map(id => ACHIEVEMENTS[id]),
            tracking: userData.achievement_tracking
        };
    } catch (err) {
        console.error('Error getting user achievements:', err);
        return { unlocked: [], tracking: {} };
    }
}

async function forceUnlockAchievement(userId, achievementId, channel = null) {
    try {
        const userData = await getOrCreateUserAchievements(userId);
        const achievement = ACHIEVEMENTS[achievementId];
        
        if (!achievement) {
            console.error('Achievement not found:', achievementId);
            return false;
        }

        if (userData.achievements.includes(achievementId)) {
            return false;
        }

        userData.achievements.push(achievementId);
        
        const newTracking = {
            ...userData.achievement_tracking,
            [achievementId]: achievement.requiredProgress
        };

        await updateUserAchievements(userId, userData.achievements, newTracking);

        if (channel) {
            try {
                const user = await channel.client.users.fetch(userId);
                const achievementEmbed = await createAchievementEmbed(achievement, user);
                await channel.send({ embeds: [achievementEmbed] });
            } catch (error) {
                console.error('Error sending achievement notification:', error);
            }
        }

        return true;
    } catch (err) {
        console.error('Error force unlocking achievement:', err);
        return false;
    }
}

module.exports = {
    ACHIEVEMENTS,
    updateAchievementProgress,
    createAchievementEmbed,
    getUserAchievements,
    forceUnlockAchievement
};