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

async function updateAchievementProgress(userId, achievementId, increment = 1, interaction = null, channel = null) {
    try {
        console.log(`Updating achievement progress for user ${userId}, achievement ${achievementId}`);
        
        const userData = await getOrCreateUserAchievements(userId);
        const achievement = ACHIEVEMENTS[achievementId];
        
        if (!achievement) {
            console.error('Achievement not found:', achievementId);
            return null;
        }

        const tracking = userData.achievement_tracking || {};
        const currentProgress = tracking[achievementId] || 0;
        const newProgress = currentProgress + increment;

        console.log(`Progress update: ${currentProgress} -> ${newProgress}/${achievement.requiredProgress}`);

        const newTracking = {
            ...tracking,
            [achievementId]: newProgress
        };

        let achievementUnlocked = null;
        
        if (newProgress >= achievement.requiredProgress && 
            !userData.achievements.includes(achievementId)) {
            achievementUnlocked = achievement;
            userData.achievements.push(achievementId);
            console.log(`Achievement unlocked: ${achievement.name}`);
        }

        await updateUserAchievements(userId, userData.achievements, newTracking);
        console.log('Database updated successfully');

        if (achievementUnlocked) {
            try {
                let user = null;
                
                if (interaction) {
                    console.log('Sending achievement notification via followUp...');
                    user = interaction.user;
                    const achievementEmbed = await createAchievementEmbed(achievementUnlocked, user);
                    await interaction.followUp({ 
                        embeds: [achievementEmbed],
                        ephemeral: false 
                    });
                    console.log('Achievement notification sent successfully via interaction!');
                } else if (channel) {
                    console.log('Sending achievement notification via channel...');
                    user = await channel.client.users.fetch(userId);
                    const achievementEmbed = await createAchievementEmbed(achievementUnlocked, user);
                    await channel.send({ 
                        embeds: [achievementEmbed]
                    });
                    console.log('Achievement notification sent successfully via channel!');
                } else {
                    console.log('No interaction or channel provided - achievement unlocked but notification not sent');
                }
            } catch (error) {
                console.error('Error sending achievement notification:', error);
                console.log('Achievement was still unlocked, just notification failed');
            }
        }

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