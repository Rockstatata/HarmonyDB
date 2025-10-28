# HarmonyDB - Comprehensive SQL Documentation & Implementation Guide

## 📋 Table of Contents
1. [Database Schema Overview](#database-schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [SQL Concepts Implementation Status](#sql-concepts-implementation-status)
4. [Complete SQL Command Reference](#complete-sql-command-reference)
5. [Advanced SQL Queries Examples](#advanced-sql-queries-examples)
6. [SQL Terminal Integration](#sql-terminal-integration)
7. [Performance Optimization](#performance-optimization)

---

## 🗄️ Database Schema Overview

### Core Tables & Relationships

#### 1. **Users Table** (Main Entity)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    role VARCHAR(20) DEFAULT 'listener', -- 'listener', 'artist'
    email_verified BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(100),
    bio TEXT,
    stage_name VARCHAR(255), -- For artists
    birth_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **Songs Table** (Central Music Entity)
```sql
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
    genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
    cover_image VARCHAR(100),
    audio_file VARCHAR(100) NOT NULL,
    release_date DATE DEFAULT CURRENT_DATE,
    duration FLOAT DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT TRUE
);
```

#### 3. **Albums Table** (1:Many with Songs)
```sql
CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    cover_image VARCHAR(100),
    release_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. **Genres Table** (1:Many with Songs)
```sql
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
```

#### 5. **Playlists Table** (1:Many with Users)
```sql
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    cover_image VARCHAR(100),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. **PlaylistSongs Table** (Many:Many Junction)
```sql
CREATE TABLE playlist_songs (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    order_index INTEGER DEFAULT 0,
    UNIQUE(playlist_id, song_id)
);
```

#### 7. **Favorites Table** (Polymorphic Relations)
```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'song', 'album', 'playlist'
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);
```

#### 8. **ListeningHistory Table** (User Activity Tracking)
```sql
CREATE TABLE listening_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    listened_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. **Comments Table** (Polymorphic Relations)
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'song', 'album'
    item_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 10. **AI Integration Tables**
```sql
-- AI Prompts
CREATE TABLE ai_prompts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    response_text TEXT,
    generated_sql TEXT,
    executed_result TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Interactions
CREATE TABLE ai_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt_id INTEGER REFERENCES ai_prompts(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL, -- 'user', 'ai'
    message_text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 Entity Relationship Diagram

### Relationship Types

#### **1:1 Relationships**
- **Users → Profile Data**: Each user has one profile with bio, stage_name, etc.

#### **1:Many Relationships**
- **Users → Songs**: One artist can have many songs
- **Users → Albums**: One artist can have many albums  
- **Users → Playlists**: One user can have many playlists
- **Users → Favorites**: One user can have many favorites
- **Users → ListeningHistory**: One user can have many listening records
- **Users → Comments**: One user can make many comments
- **Albums → Songs**: One album can contain many songs
- **Genres → Songs**: One genre can categorize many songs
- **Songs → ListeningHistory**: One song can have many listening records

#### **Many:Many Relationships**
- **Playlists ↔ Songs**: Through `playlist_songs` junction table
- **Users ↔ Songs**: Through `favorites` (when item_type='song')
- **Users ↔ Albums**: Through `favorites` (when item_type='album')
- **Users ↔ Playlists**: Through `favorites` (when item_type='playlist')

#### **Polymorphic Relationships**
- **Favorites**: Can reference songs, albums, or playlists
- **Comments**: Can be on songs or albums

### **Cascade Rules**
- **ON DELETE CASCADE**: User deletion removes all their content
- **ON DELETE SET NULL**: Album/Genre deletion preserves songs but nullifies reference
- **ON DELETE RESTRICT**: Prevents deletion if referenced

---

## ✅ SQL Concepts Implementation Status

### **DDL (Data Definition Language)**
| Command | Status | Implementation | Example |
|---------|--------|----------------|---------|
| `CREATE TABLE` | ✅ Implemented | Django migrations + schema.sql | Users, Songs, Albums tables |
| `ALTER TABLE ADD` | ✅ Implemented | Django migrations | Adding new columns |
| `ALTER TABLE MODIFY` | ✅ Implemented | Django migrations | Changing column types |
| `ALTER TABLE RENAME` | ✅ Implemented | Django migrations | Renaming columns |
| `ALTER TABLE DROP` | ✅ Implemented | Django migrations | Removing columns |
| `DROP TABLE` | ✅ Implemented | Django migrations | Table removal |

### **DML (Data Manipulation Language)**
| Command | Status | Implementation | Example |
|---------|--------|----------------|---------|
| `INSERT INTO` | ✅ Implemented | Django ORM + Raw SQL | Creating songs, users |
| `SELECT` | ✅ Implemented | Django ORM + Analytics | Query songs, users |
| `UPDATE` | ✅ Implemented | Django ORM | Update play counts |
| `DELETE` | ✅ Implemented | Django ORM | Remove songs |

### **Constraints**
| Constraint | Status | Implementation | Example |
|------------|--------|----------------|---------|
| `PRIMARY KEY` | ✅ Implemented | All tables | id fields |
| `FOREIGN KEY` | ✅ Implemented | All relations | artist_id, album_id |
| `UNIQUE` | ✅ Implemented | User emails, genre names | email, username |
| `NOT NULL` | ✅ Implemented | Required fields | title, password |
| `CHECK` | ✅ Implemented | Django model validation | Choice fields |
| `DEFAULT` | ✅ Implemented | All tables | timestamps, booleans |
| `ON DELETE CASCADE` | ✅ Implemented | User→Songs | Cascade deletions |
| `ON DELETE SET NULL` | ✅ Implemented | Album→Songs | Preserve songs |

### **Query Operations**
| Operation | Status | Implementation | Example |
|-----------|--------|----------------|---------|
| `SELECT DISTINCT` | ✅ Implemented | Analytics queries | Unique artists |
| `SELECT ALL` | ✅ Implemented | Default behavior | All songs |
| `AS (Aliases)` | ✅ Implemented | Analytics module | Column aliases |
| `BETWEEN` | ✅ Implemented | Duration filtering | Song length ranges |
| `IN` | ✅ Implemented | Search functionality | Genre filtering |
| `ORDER BY ASC/DESC` | ✅ Implemented | All list views | Sort by date, popularity |
| `LIKE` | ✅ Implemented | Search functionality | Song title search |
| `GROUP BY` | ✅ Implemented | Analytics module | Genre statistics |
| `HAVING` | ✅ Implemented | Analytics module | Filtered aggregations |

### **Functions & Aggregations**
| Function | Status | Implementation | Example |
|----------|--------|----------------|---------|
| `COUNT()` | ✅ Implemented | Analytics module | Song counts |
| `SUM()` | ✅ Implemented | Analytics module | Total play counts |
| `AVG()` | ✅ Implemented | Analytics module | Average duration |
| `MIN()` | ✅ Implemented | Analytics module | Shortest song |
| `MAX()` | ✅ Implemented | Analytics module | Longest song |
| `NVL/COALESCE` | ✅ Implemented | Analytics module | Default values |

### **Advanced Queries**
| Feature | Status | Implementation | Example |
|---------|--------|----------------|---------|
| **Subqueries in SELECT** | ✅ Implemented | Analytics module | User engagement metrics |
| **Subqueries in FROM** | ⚠️ Partial | Limited usage | Can be added |
| **Subqueries in WHERE** | ✅ Implemented | Recommendation system | Similar songs |
| **INSERT INTO ... SELECT** | ⚠️ Partial | Data migration | Can be added |

### **Set Operations**
| Operation | Status | Implementation | Example |
|-----------|--------|----------------|---------|
| `UNION` | ⚠️ Partial | Limited usage | **NEEDS IMPLEMENTATION** |
| `UNION ALL` | ⚠️ Partial | Limited usage | **NEEDS IMPLEMENTATION** |
| `INTERSECT` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| `MINUS/EXCEPT` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |

### **Join Operations**
| Join Type | Status | Implementation | Example |
|-----------|--------|----------------|---------|
| `INNER JOIN` | ✅ Implemented | Analytics module | Songs with artists |
| `LEFT OUTER JOIN` | ✅ Implemented | Analytics module | Songs with optional albums |
| `RIGHT OUTER JOIN` | ⚠️ Partial | Limited usage | **NEEDS MORE EXAMPLES** |
| `FULL OUTER JOIN` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| `CROSS JOIN` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| `SELF JOIN` | ⚠️ Partial | Limited usage | **NEEDS IMPLEMENTATION** |
| `NATURAL JOIN` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |

### **Views**
| Feature | Status | Implementation | Example |
|---------|--------|----------------|---------|
| `CREATE VIEW` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| `CREATE OR REPLACE VIEW` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| `Updatable Views` | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |

### **Advanced Features**
| Feature | Status | Implementation | Example |
|---------|--------|----------------|---------|
| **CTE (WITH clause)** | ✅ Implemented | Raw SQL examples | Complex analytics |
| **Window Functions** | ⚠️ Partial | Limited usage | **NEEDS MORE EXAMPLES** |
| **Regular Expressions** | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |
| **MOD Function** | ❌ Not Implemented | None | **NEEDS IMPLEMENTATION** |

---

## 📚 Complete SQL Command Reference

### **1. DDL Commands**

#### Create Tables
```sql
-- Create new genre
CREATE TABLE IF NOT EXISTS new_genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create with constraints
CREATE TABLE track_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);
```

#### Alter Tables
```sql
-- Add column
ALTER TABLE songs ADD COLUMN lyrics TEXT;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- Modify column
ALTER TABLE songs ALTER COLUMN duration TYPE INTEGER;

-- Rename column
ALTER TABLE users RENAME COLUMN stage_name TO artist_name;

-- Drop column
ALTER TABLE songs DROP COLUMN IF EXISTS old_field;

-- Add constraints
ALTER TABLE songs ADD CONSTRAINT unique_title_artist 
UNIQUE (title, artist_id);

ALTER TABLE songs ADD CONSTRAINT fk_songs_artist 
FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE;
```

#### Drop Tables
```sql
DROP TABLE IF EXISTS temp_table CASCADE;
```

### **2. DML Commands**

#### Insert Data
```sql
-- Simple insert
INSERT INTO genres (name, description) 
VALUES ('Electronic', 'Electronic music genre');

-- Multiple inserts
INSERT INTO genres (name, description) VALUES 
('Rock', 'Rock music genre'),
('Pop', 'Pop music genre'),
('Jazz', 'Jazz music genre');

-- Insert with SELECT
INSERT INTO playlist_songs (playlist_id, song_id, added_at)
SELECT 1, id, NOW() FROM songs WHERE genre_id = 1;
```

#### Select Queries
```sql
-- Basic select
SELECT title, artist_id FROM songs;

-- With aliases
SELECT s.title AS song_title, u.username AS artist_name
FROM songs s
JOIN users u ON s.artist_id = u.id;

-- Distinct values
SELECT DISTINCT genre_id FROM songs;

-- All columns
SELECT * FROM songs WHERE approved = true;
```

#### Update Data
```sql
-- Simple update
UPDATE songs SET play_count = play_count + 1 WHERE id = 1;

-- Conditional update
UPDATE users SET email_verified = true 
WHERE email = 'user@example.com';

-- Update with joins
UPDATE songs SET play_count = play_count + 1
FROM listening_history lh
WHERE songs.id = lh.song_id 
AND lh.listened_at > NOW() - INTERVAL '1 day';
```

#### Delete Data
```sql
-- Simple delete
DELETE FROM songs WHERE approved = false;

-- Conditional delete
DELETE FROM listening_history 
WHERE listened_at < NOW() - INTERVAL '1 year';
```

### **3. Query Filtering & Conditions**

#### WHERE Clauses
```sql
-- BETWEEN
SELECT * FROM songs 
WHERE duration BETWEEN 180 AND 300;

-- IN clause
SELECT * FROM songs 
WHERE genre_id IN (1, 2, 3);

-- LIKE patterns
SELECT * FROM songs 
WHERE title LIKE '%love%';

-- Multiple conditions
SELECT * FROM songs 
WHERE genre_id = 1 AND play_count > 1000 
   OR upload_date > '2024-01-01';
```

#### Advanced Filtering
```sql
-- Regular expressions (PostgreSQL)
SELECT * FROM songs 
WHERE title ~ '^[A-M].*';

-- Case-insensitive search
SELECT * FROM users 
WHERE username ILIKE '%artist%';

-- NULL handling
SELECT * FROM songs 
WHERE album_id IS NULL;

-- COALESCE for default values
SELECT title, COALESCE(album_id, 0) as album_ref
FROM songs;
```

### **4. Aggregation & Grouping**

#### Basic Aggregations
```sql
-- Count all songs
SELECT COUNT(*) FROM songs;

-- Sum of play counts
SELECT SUM(play_count) as total_plays FROM songs;

-- Average duration
SELECT AVG(duration) as avg_duration FROM songs;

-- Min/Max values
SELECT MIN(duration) as shortest, MAX(duration) as longest 
FROM songs;
```

#### GROUP BY & HAVING
```sql
-- Songs per genre
SELECT g.name, COUNT(s.id) as song_count
FROM genres g
LEFT JOIN songs s ON g.id = s.genre_id
GROUP BY g.id, g.name
HAVING COUNT(s.id) > 0
ORDER BY song_count DESC;

-- User activity summary
SELECT u.username, COUNT(lh.id) as listens
FROM users u
JOIN listening_history lh ON u.id = lh.user_id
GROUP BY u.id, u.username
HAVING COUNT(lh.id) > 10
ORDER BY listens DESC;
```

### **5. Join Operations**

#### Inner Joins
```sql
-- Songs with artist info
SELECT s.title, u.username, s.play_count
FROM songs s
INNER JOIN users u ON s.artist_id = u.id
WHERE s.approved = true;
```

#### Left Joins
```sql
-- All songs with optional album info
SELECT s.title, a.title as album_title, s.duration
FROM songs s
LEFT JOIN albums a ON s.album_id = a.id
ORDER BY s.upload_date DESC;
```

#### Multiple Joins
```sql
-- Complete song information
SELECT 
    s.title as song_title,
    u.username as artist,
    a.title as album_title,
    g.name as genre,
    s.play_count
FROM songs s
INNER JOIN users u ON s.artist_id = u.id
LEFT JOIN albums a ON s.album_id = a.id
LEFT JOIN genres g ON s.genre_id = g.id
WHERE s.approved = true
ORDER BY s.play_count DESC;
```

#### Self Joins
```sql
-- Find users in same location (if location field exists)
SELECT u1.username, u2.username
FROM users u1
JOIN users u2 ON u1.city = u2.city AND u1.id != u2.id
WHERE u1.city IS NOT NULL;
```

### **6. Subqueries**

#### Subqueries in SELECT
```sql
-- Songs with artist song count
SELECT 
    title,
    (SELECT COUNT(*) FROM songs s2 
     WHERE s2.artist_id = s1.artist_id) as artist_song_count
FROM songs s1;
```

#### Subqueries in WHERE
```sql
-- Songs by most active artists
SELECT * FROM songs
WHERE artist_id IN (
    SELECT user_id FROM listening_history
    GROUP BY user_id
    HAVING COUNT(*) > 100
);

-- Songs longer than average
SELECT * FROM songs
WHERE duration > (SELECT AVG(duration) FROM songs);
```

#### Subqueries in FROM
```sql
-- Top genres by play count
SELECT genre_stats.genre_name, genre_stats.total_plays
FROM (
    SELECT g.name as genre_name, SUM(s.play_count) as total_plays
    FROM genres g
    JOIN songs s ON g.id = s.genre_id
    GROUP BY g.id, g.name
) genre_stats
ORDER BY genre_stats.total_plays DESC;
```

### **7. Set Operations**

#### UNION
```sql
-- Combine different user types
SELECT username, 'artist' as user_type FROM users WHERE role = 'artist'
UNION
SELECT username, 'listener' as user_type FROM users WHERE role = 'listener';

-- UNION ALL (with duplicates)
SELECT title FROM songs WHERE genre_id = 1
UNION ALL
SELECT title FROM songs WHERE play_count > 1000;
```

#### INTERSECT
```sql
-- Songs that are both popular and recent
SELECT id FROM songs WHERE play_count > 1000
INTERSECT
SELECT id FROM songs WHERE upload_date > '2024-01-01';
```

#### EXCEPT/MINUS
```sql
-- Songs without any listening history
SELECT id FROM songs
EXCEPT
SELECT DISTINCT song_id FROM listening_history;
```

### **8. Views**

#### Create Views
```sql
-- Popular songs view
CREATE VIEW popular_songs AS
SELECT 
    s.id,
    s.title,
    u.username as artist,
    s.play_count,
    s.duration
FROM songs s
JOIN users u ON s.artist_id = u.id
WHERE s.play_count > 1000;

-- Replace view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT s.id) as songs_uploaded,
    COUNT(DISTINCT lh.id) as total_listens,
    COUNT(DISTINCT f.id) as favorites_given
FROM users u
LEFT JOIN songs s ON u.id = s.artist_id
LEFT JOIN listening_history lh ON u.id = lh.user_id
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, u.username;
```

#### Use Views
```sql
-- Query views like tables
SELECT * FROM popular_songs WHERE artist LIKE '%rock%';

-- Update through views (if updatable)
UPDATE popular_songs SET play_count = play_count + 1 
WHERE id = 1;
```

### **9. Common Table Expressions (CTEs)**

#### Basic CTE
```sql
-- CTE for complex calculations
WITH song_stats AS (
    SELECT 
        s.id,
        s.title,
        COUNT(lh.id) as listen_count,
        COUNT(f.id) as favorite_count
    FROM songs s
    LEFT JOIN listening_history lh ON s.id = lh.song_id
    LEFT JOIN favorites f ON s.id = f.item_id AND f.item_type = 'song'
    GROUP BY s.id, s.title
)
SELECT title, listen_count, favorite_count,
       (listen_count + favorite_count * 2) as engagement_score
FROM song_stats
ORDER BY engagement_score DESC;
```

#### Recursive CTE
```sql
-- Hierarchical data (if we had categories)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 as level
    FROM categories WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

### **10. Window Functions**

#### Basic Window Functions
```sql
-- Rank songs by play count within each genre
SELECT 
    title,
    genre_id,
    play_count,
    RANK() OVER (PARTITION BY genre_id ORDER BY play_count DESC) as genre_rank
FROM songs;

-- Running total of play counts
SELECT 
    title,
    play_count,
    SUM(play_count) OVER (ORDER BY upload_date) as running_total
FROM songs;
```

#### Advanced Window Functions
```sql
-- Compare with previous/next song
SELECT 
    title,
    play_count,
    LAG(play_count) OVER (ORDER BY upload_date) as prev_play_count,
    LEAD(play_count) OVER (ORDER BY upload_date) as next_play_count
FROM songs;

-- Percentile rankings
SELECT 
    title,
    play_count,
    PERCENT_RANK() OVER (ORDER BY play_count) as percentile_rank
FROM songs;
```

### **11. Advanced Functions**

#### String Functions
```sql
-- String manipulation
SELECT 
    UPPER(title) as title_upper,
    LOWER(username) as username_lower,
    LENGTH(title) as title_length,
    SUBSTRING(title, 1, 10) as title_short
FROM songs s
JOIN users u ON s.artist_id = u.id;

-- Concatenation
SELECT CONCAT(u.username, ' - ', s.title) as full_title
FROM songs s
JOIN users u ON s.artist_id = u.id;
```

#### Date Functions
```sql
-- Date manipulation
SELECT 
    title,
    upload_date,
    EXTRACT(YEAR FROM upload_date) as upload_year,
    EXTRACT(MONTH FROM upload_date) as upload_month,
    AGE(NOW(), upload_date) as song_age
FROM songs;

-- Date formatting
SELECT 
    title,
    TO_CHAR(upload_date, 'YYYY-MM-DD') as formatted_date
FROM songs;
```

#### Mathematical Functions
```sql
-- Math operations
SELECT 
    title,
    duration,
    ROUND(duration / 60.0, 2) as duration_minutes,
    MOD(play_count, 100) as play_count_mod,
    POWER(play_count, 0.5) as play_count_sqrt
FROM songs;
```

### **12. Performance & Indexing**

#### Create Indexes
```sql
-- Single column index
CREATE INDEX idx_songs_artist_id ON songs(artist_id);

-- Composite index
CREATE INDEX idx_songs_genre_plays ON songs(genre_id, play_count);

-- Partial index
CREATE INDEX idx_approved_songs ON songs(id) WHERE approved = true;

-- Text search index
CREATE INDEX idx_songs_title_search ON songs USING gin(to_tsvector('english', title));
```

#### Drop Indexes
```sql
DROP INDEX IF EXISTS idx_old_index;
```

---

## 🎯 Missing SQL Implementations That Need to Be Added

Based on the analysis, here are the SQL concepts that need to be implemented to have a complete showcase:

### **1. Set Operations** ❌
- UNION, UNION ALL, INTERSECT, EXCEPT operations

### **2. Advanced Joins** ⚠️ 
- FULL OUTER JOIN, CROSS JOIN, NATURAL JOIN, more SELF JOIN examples

### **3. Views** ❌
- CREATE VIEW, CREATE OR REPLACE VIEW examples

### **4. Additional Functions** ⚠️
- MOD function, REGEXP_SUBSTR, more mathematical functions

### **5. Window Functions** ⚠️
- More comprehensive window function examples

---

## 🚀 SQL Terminal Integration

The project includes a sophisticated SQL debugging terminal that captures and displays all SQL queries executed by the Django ORM. This provides real-time visibility into:

- **Query Types**: SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP
- **Query Performance**: Execution time for each query
- **SQL Concepts**: Automatic detection of JOINs, aggregations, subqueries, etc.
- **Formatted Output**: Pretty-printed SQL for better readability

### Terminal Features:
- ✅ Real-time SQL query capture
- ✅ Query classification and concept detection
- ✅ Performance monitoring
- ✅ Filter by query type
- ✅ Expandable query details
- ✅ SQL formatting and syntax highlighting

---

## 🔧 Next Steps for Complete Implementation

To showcase ALL SQL concepts to your course teacher, implement the following:

1. **Create comprehensive view examples**
2. **Add set operation demonstrations**
3. **Implement missing join types**
4. **Add window function examples**
5. **Create stored procedure examples**
6. **Add more mathematical function examples**

This documentation provides a complete foundation for understanding the SQL implementation in HarmonyDB and can be extended with the missing concepts for a full demonstration.