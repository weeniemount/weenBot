/* 
if you are setting up the bot i probably told you to go here from the README.md

these are the queries that you NEED to run to setup the database for the bot!

CREATE TABLE weenspeakchannelids (id SERIAL PRIMARY KEY, channel_id TEXT UNIQUE NOT NULL);
CREATE TABLE personalbuttons (user_id TEXT PRIMARY KEY, count INTEGER DEFAULT 0);
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY,
    allow_pings BOOLEAN DEFAULT true,
    button_color TEXT DEFAULT 'Primary',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE weenbotinfo (commandsran INTEGER PRIMARY KEY DEFAULT 0)

-- FUNCTION FOR INCREMENTING!!
CREATE OR REPLACE FUNCTION increment_commands_run()
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE weenbotinfo 
    SET commandsran = COALESCE(commandsran, 0) + 1
    RETURNING commandsran INTO new_count;
    
    IF NOT FOUND THEN
        INSERT INTO weenbotinfo (commandsran) VALUES (1)
        RETURNING commandsran INTO new_count;
    END IF;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;
-- end of function lol

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
    }
    return client;
}

async function getButtonCount(userId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data, error } = await supabase
            .from('personalbuttons')
            .select('count')
            .eq('user_id', userId)
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

async function updateButtonCount(userId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const currentCount = await getButtonCount(userId);
        const newCount = currentCount + 1;
        
        const { data, error } = await supabase
            .from('personalbuttons')
            .upsert([{ user_id: userId, count: newCount }])
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

async function resetButtonCount(userId) {
    if (!supabase) {
        console.log('Supabase client not initialized, attempting to initialize...');
        initializeSupabase();
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
    }
    
    try {
        const { data, error } = await supabase
            .from('personalbuttons')
            .upsert([{ user_id: userId, count: 0 }])
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
        
        const buttonCount = await getButtonCount(userId);
        
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
		const { data, error } = await supabase
			.rpc('increment_commands_run');

		if (error) throw error;
		return data;
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
			.select('commandsran')
			.limit(1)
			.single();

		if (error && error.code === 'PGRST116') {
			return 0;
		}

		if (error) throw error;
		return data.commandsran || 0;
	} catch (err) {
		console.error('Error getting commands run:', err);
		return 0;
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
    getUserSettings,
    updateUserSettings,
    checkUserAllowsPings,
    incrementCommandsRun,
    getCommandsRun
};