-- =======================
-- 1. Users
-- =======================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'artist', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 2. Artists (1:1 with Users)
-- =======================
CREATE TABLE artists (
    artist_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_picture_url VARCHAR(255)
);

-- =======================
-- 3. Albums
-- =======================
CREATE TABLE albums (
    album_id SERIAL PRIMARY KEY,
    artist_id INT REFERENCES artists(artist_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    cover_url VARCHAR(255)
);

-- =======================
-- 4. Genres
-- =======================
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- =======================
-- 5. Songs
-- =======================
CREATE TABLE songs (
    song_id SERIAL PRIMARY KEY,
    album_id INT REFERENCES albums(album_id) ON DELETE SET NULL,
    artist_id INT REFERENCES artists(artist_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    duration INT NOT NULL, -- in seconds
    file_url VARCHAR(255) NOT NULL,
    release_date DATE
);

-- =======================
-- 6. Playlists
-- =======================
CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 7. Playlist_Songs (M:N)
-- =======================
CREATE TABLE playlist_songs (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(playlist_id, song_id)
);

-- =======================
-- 8. Favorites
-- =======================
CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE SET NULL,
    album_id INT REFERENCES albums(album_id) ON DELETE SET NULL,
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE SET NULL
);

-- =======================
-- 9. Listening_History
-- =======================
CREATE TABLE listening_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    played_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 10. Comments
-- =======================
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE SET NULL,
    album_id INT REFERENCES albums(album_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 11. Admin_Logs
-- =======================
CREATE TABLE admin_logs (
    log_id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 12. AI_Prompts (LLM Integration)
-- =======================
CREATE TABLE ai_prompts (
    prompt_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    generated_sql TEXT,
    executed_result TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 13. AI_Interactions (optional multi-turn chat)
-- =======================
CREATE TABLE ai_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    prompt_id INT REFERENCES ai_prompts(prompt_id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL, -- 'user' or 'ai'
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =======================
-- 14. Track Genres (M:N)
-- =======================
CREATE TABLE track_genres (
    track_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY(track_id, genre_id)
);
