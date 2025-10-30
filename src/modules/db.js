/* 
if you are setting up the bot i probably told you to go here from the README.md

these are the queries that you NEED to run to setup the database for the bot!

CREATE TABLE weenspeakchannelids (id SERIAL PRIMARY KEY, channel_id TEXT UNIQUE NOT NULL);
CREATE TABLE buttons (
    id SERIAL PRIMARY KEY,
    button_type TEXT NOT NULL CHECK (button_type IN ('personal', 'server', 'global')),
    reference_id TEXT NOT NULL, -- user_id for personal, server_id for server, 'global' for global
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(button_type, reference_id)
);
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY,
    allow_pings BOOLEAN DEFAULT true,
    button_color TEXT DEFAULT 'Primary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE weenbotinfo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commands_run INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE user_achievements (
    user_id TEXT PRIMARY KEY,
    achievements JSONB DEFAULT '[]'::jsonb,
    achievement_tracking JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX idx_buttons_type_ref ON buttons(button_type, reference_id);
CREATE INDEX idx_buttons_updated ON buttons(updated_at);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

INSERT INTO buttons (button_type, reference_id, count) 
VALUES ('global', 'global', 0) 
ON CONFLICT (button_type, reference_id) DO NOTHING;

CREATE TABLE regex_filters (
    id SERIAL PRIMARY KEY,
    server_id TEXT NOT NULL,
    pattern TEXT NOT NULL,
    name TEXT NOT NULL,
    action TEXT DEFAULT 'delete' CHECK (action IN ('delete', 'warn', 'timeout')),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_regex_filters_server ON regex_filters(server_id);
CREATE INDEX idx_regex_filters_enabled ON regex_filters(enabled);
CREATE INDEX idx_regex_filters_server_enabled ON regex_filters(server_id, enabled);

CREATE TABLE regex_filter_logs (
    id SERIAL PRIMARY KEY,
    filter_id INTEGER REFERENCES regex_filters(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_content TEXT,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_regex_filter_logs_server ON regex_filter_logs(server_id);
CREATE INDEX idx_regex_filter_logs_user ON regex_filter_logs(user_id);
CREATE INDEX idx_regex_filter_logs_created ON regex_filter_logs(created_at);

okay thank you for coming to my WEEN talk
*/

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function initializeSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
        return null;
    }
    
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Supabase client created successfully');
    return supabase;
}

async function addWeenSpeakChannel(channelId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    try {
        const { data, error } = await supabase
            .from('weenspeakchannelids')
            .insert([{ channel_id: channelId }])
            .select();
        
        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Channel is already a weenspeak channel');
            }
            throw error;
        }
        
        return data;
    } catch (err) {
        console.error('Error adding weenspeak channel:', err);
        throw err;
    }
}

async function getWeenSpeakChannels() {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            console.error('Failed to initialize Supabase client');
            return [];
        }
    }
    
    try {
        console.log('Fetching weenspeak channels from database...');
        const { data, error } = await supabase
            .from('weenspeakchannelids')
            .select('channel_id');
        
        if (error) {
            console.error('Error fetching weenspeak channels:', error);
            return [];
        }
        
        console.log(`Found ${data.length} weenspeak channels`);
        return data.map(row => row.channel_id);
    } catch (err) {
        console.error('Error getting weenspeak channels:', err);
        return [];
    }
}

async function removeWeenSpeakChannel(channelId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    try {
        const { data, error } = await supabase
            .from('weenspeakchannelids')
            .delete()
            .eq('channel_id', channelId)
            .select();
        
        if (error) {
            throw error;
        }
        
        return data.length > 0;
    } catch (err) {
        console.error('Error removing weenspeak channel:', err);
        throw err;
    }
}

async function initializeDB() {
    const client = initializeSupabase();
    if (client) {
        console.log('Database initialized');
        try {
            await getButtonCount('global', 'global');
        } catch (err) {
            console.log('Creating global button record...');
        }
    }
    return client;
}

async function getButtonCount(buttonType, referenceId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data, error } = await supabase
            .from('buttons')
            .select('count')
            .eq('button_type', buttonType)
            .eq('reference_id', referenceId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        return data ? data.count : 0;
    } catch (err) {
        console.error('Error getting button count:', err);
        return 0;
    }
}

async function updateButtonCount(buttonType, referenceId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('buttons')
            .select('count')
            .eq('button_type', buttonType)
            .eq('reference_id', referenceId)
            .single();
        
        let currentCount = 0;
        if (!fetchError && existingData) {
            currentCount = existingData.count;
        }
        
        const newCount = currentCount + 1;
        
        const { data, error } = await supabase
            .from('buttons')
            .upsert([{ 
                button_type: buttonType, 
                reference_id: referenceId, 
                count: newCount,
                updated_at: new Date().toISOString()
            }], {
                onConflict: 'button_type,reference_id'
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        return newCount;
    } catch (err) {
        console.error('Error updating button count:', err);
        throw err;
    }
}

async function resetButtonCount(buttonType, referenceId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data, error } = await supabase
            .from('buttons')
            .upsert([{ 
                button_type: buttonType, 
                reference_id: referenceId, 
                count: 0,
                updated_at: new Date().toISOString()
            }], {
                onConflict: 'button_type,reference_id'
            })
            .select();
        
        if (error) {
            throw error;
        }
        
        return true;
    } catch (err) {
        console.error('Error resetting button count:', err);
        throw err;
    }
}

async function getPersonalButtonCount(userId) {
    return await getButtonCount('personal', userId);
}

async function updatePersonalButtonCount(userId) {
    return await updateButtonCount('personal', userId);
}

async function resetPersonalButtonCount(userId) {
    return await resetButtonCount('personal', userId);
}

async function getUserSettings(userId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        const buttonCount = await getPersonalButtonCount(userId);
        
        if (settingsError && settingsError.code === 'PGRST116') {
            return {
                user_id: userId,
                allow_pings: true,
                button_color: 'Primary',
                button_count: buttonCount
            };
        }
        
        if (settingsError) {
            throw settingsError;
        }
        
        return {
            ...settingsData,
            button_count: buttonCount
        };
    } catch (err) {
        console.error('Error getting user settings:', err);
        return {
            user_id: userId,
            allow_pings: true,
            button_color: 'Primary',
            button_count: 0
        };
    }
}

async function updateUserSettings(userId, settings) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const updateData = {
            user_id: userId,
            updated_at: new Date().toISOString(),
            ...settings
        };
        
        const { data, error } = await supabase
            .from('user_settings')
            .upsert([updateData])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        return data;
    } catch (err) {
        console.error('Error updating user settings:', err);
        throw err;
    }
}

async function checkUserAllowsPings(userId) {
    try {
        const settings = await getUserSettings(userId);
        return settings.allow_pings;
    } catch (err) {
        console.error('Error checking user ping settings:', err);
        return true;
    }
}

async function incrementCommandsRun() {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }

    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('weenbotinfo')
            .select('*')
            .limit(1)
            .single();

        let newCount = 1;
        let recordId = null;

        if (!fetchError && existingData) {
            newCount = (existingData.commands_run || 0) + 1;
            recordId = existingData.id;
        }

        const { data, error } = await supabase
            .from('weenbotinfo')
            .upsert([{
                id: recordId,
                commands_run: newCount,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return newCount;
    } catch (err) {
        console.error('Error incrementing commands run:', err);
        throw err;
    }
}

async function getCommandsRun() {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }

    try {
        const { data, error } = await supabase
            .from('weenbotinfo')
            .select('commands_run')
            .limit(1)
            .single();

        if (error && error.code === 'PGRST116') {
            const { data: newData, error: insertError } = await supabase
                .from('weenbotinfo')
                .insert([{ commands_run: 0 }])
                .select()
                .single();

            if (insertError) throw insertError;
            return 0;
        }

        if (error) {
            throw error;
        }

        return data ? data.commands_run : 0;
    } catch (err) {
        console.error('Error getting commands run:', err);
        return 0;
    }
}

async function getOrCreateUserAchievements(userId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }

    try {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            const newData = {
                user_id: userId,
                achievements: [],
                achievement_tracking: {}
            };

            const { data: insertedData, error: insertError } = await supabase
                .from('user_achievements')
                .insert([newData])
                .select()
                .single();

            if (insertError) throw insertError;
            return insertedData;
        }

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error getting user achievements:', err);
        throw err;
    }
}

async function updateUserAchievements(userId, achievements, tracking) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }

    try {
        const { error } = await supabase
            .from('user_achievements')
            .update({
                achievements: achievements,
                achievement_tracking: tracking,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating user achievements:', err);
        throw err;
    }
}

async function getLeaderboardPersonalButtons(limit = 10) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('buttons')
            .select('reference_id, count')
            .eq('button_type', 'personal')
            .order('count', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error getting personal button leaderboard:', err);
        return [];
    }
}

async function getLeaderboardServerButtons(limit = 10) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('buttons')
            .select('reference_id, count')
            .eq('button_type', 'server')
            .order('count', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error getting server button leaderboard:', err);
        return [];
    }
}

async function getLeaderboardAchievements(limit = 10) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('user_id, achievements');

        if (error) throw error;
        
        if (!data) return [];

        const sorted = data
            .map(entry => ({
                user_id: entry.user_id,
                count: Array.isArray(entry.achievements) ? entry.achievements.length : 0
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted;
    } catch (err) {
        console.error('Error getting achievement leaderboard:', err);
        return [];
    }
}

async function getServerPersonalButtons(memberIds, limit = 10) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('buttons')
            .select('reference_id, count')
            .eq('button_type', 'personal')
            .in('reference_id', memberIds)
            .order('count', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error getting server personal buttons:', err);
        return [];
    }
}

async function getServerAchievements(memberIds, limit = 10) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('user_achievements')
            .select('user_id, achievements')
            .in('user_id', memberIds);

        if (error) throw error;
        
        if (!data) return [];

        const sorted = data
            .map(entry => ({
                user_id: entry.user_id,
                count: Array.isArray(entry.achievements) ? entry.achievements.length : 0
            }))
            .filter(entry => entry.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted;
    } catch (err) {
        console.error('Error getting server achievements:', err);
        return [];
    }
}

async function addRegexFilter(serverId, pattern, name, action = 'delete') {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('regex_filters')
            .insert([{
                server_id: serverId,
                pattern: pattern,
                name: name,
                action: action,
                enabled: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error adding regex filter:', err);
        throw err;
    }
}

async function removeRegexFilter(serverId, filterId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('regex_filters')
            .delete()
            .eq('server_id', serverId)
            .eq('id', filterId)
            .select();

        if (error) throw error;
        return data && data.length > 0;
    } catch (err) {
        console.error('Error removing regex filter:', err);
        throw err;
    }
}

async function updateRegexFilter(serverId, filterId, updates) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('regex_filters')
            .update(updateData)
            .eq('server_id', serverId)
            .eq('id', filterId)
            .select()
            .single();

        if (error && error.code === 'PGRST116') {
            return null;
        }

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error updating regex filter:', err);
        throw err;
    }
}

async function getServerRegexFilters(serverId) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('regex_filters')
            .select('*')
            .eq('server_id', serverId)
            .eq('enabled', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error getting server regex filters:', err);
        return [];
    }
}

async function getAllRegexFilters() {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        const { data, error } = await supabase
            .from('regex_filters')
            .select('*')
            .eq('enabled', true);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error getting all regex filters:', err);
        return [];
    }
}


module.exports = {
    db: supabase,
    addWeenSpeakChannel,
    getWeenSpeakChannels,
    removeWeenSpeakChannel,
    initializeDB,
    
    getButtonCount,
    updateButtonCount,
    resetButtonCount,
    
    getPersonalButtonCount,
    updatePersonalButtonCount,
    resetPersonalButtonCount,
    
    getUserSettings,
    updateUserSettings,
    checkUserAllowsPings,
    incrementCommandsRun,
    getCommandsRun,
    getOrCreateUserAchievements,
    updateUserAchievements,

    getLeaderboardPersonalButtons,
    getLeaderboardServerButtons,
    getLeaderboardAchievements,
    getServerPersonalButtons,
    getServerAchievements,

    addRegexFilter,
    removeRegexFilter,
    updateRegexFilter,
    getServerRegexFilters,
    getAllRegexFilters
};