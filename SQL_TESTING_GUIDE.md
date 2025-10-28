# SQL Concepts Testing Guide 🎯

## Overview
This guide helps you test and verify that all SQL concepts are properly demonstrated in HarmonyDB.

## Prerequisites
1. ✅ Backend server running: `python manage.py runserver`
2. ✅ Frontend development server running: `npm run dev`
3. ✅ SQL Terminal open (toggle with SQL icon in header)
4. ✅ User logged in to the application

---

## SQL Concepts Checklist

### 1. Basic SQL Operations (DDL/DML)

#### CREATE/INSERT (Create Operations)
- [ ] **Test**: Upload a new song as artist
- [ ] **Location**: Profile → Upload Song
- [ ] **SQL Terminal Should Show**: `INSERT INTO songs_song (...) VALUES (...)`
- [ ] **Concepts**: INSERT, DDL

#### READ Operations (SELECT)
- [ ] **Test**: View Dashboard
- [ ] **Location**: Dashboard page
- [ ] **SQL Terminal Should Show**: Multiple `SELECT` queries for popular songs, albums
- [ ] **Concepts**: SELECT, WHERE

#### UPDATE Operations
- [ ] **Test**: Update profile information
- [ ] **Location**: Profile → Edit Profile
- [ ] **SQL Terminal Should Show**: `UPDATE users_user SET ... WHERE id = ...`
- [ ] **Concepts**: UPDATE, WHERE

#### DELETE Operations
- [ ] **Test**: Delete a playlist
- [ ] **Location**: Library → Your Playlists → Delete
- [ ] **SQL Terminal Should Show**: `DELETE FROM songs_playlist WHERE ...`
- [ ] **Concepts**: DELETE, WHERE

---

### 2. Advanced SELECT Operations

#### LIKE Pattern Matching
- [ ] **Test**: Search for songs with partial name
- [ ] **Location**: Search page → Enter "love" or similar
- [ ] **SQL Terminal Should Show**: `WHERE title LIKE '%love%'`
- [ ] **Concepts**: LIKE, Pattern Matching

#### IN Operator
- [ ] **Test**: Filter search by multiple genres
- [ ] **Location**: Search page → Select multiple genres
- [ ] **SQL Terminal Should Show**: `WHERE genre_id IN (1, 2, 3)`
- [ ] **Concepts**: IN, Multiple values

#### BETWEEN Operator
- [ ] **Test**: Use date range filter
- [ ] **Location**: Search page → Advanced filters → Date range
- [ ] **SQL Terminal Should Show**: `WHERE created_at BETWEEN '...' AND '...'`
- [ ] **Concepts**: BETWEEN, Date filtering

---

### 3. JOIN Operations

#### INNER JOIN
- [ ] **Test**: View Artists page
- [ ] **Location**: Artists page
- [ ] **SQL Terminal Should Show**: 
  ```sql
  SELECT u.*, COUNT(s.id) as song_count
  FROM users_user u
  INNER JOIN songs_song s ON s.artist_id = u.id
  ```
- [ ] **Concepts**: INNER JOIN, Table relationships

#### LEFT JOIN
- [ ] **Test**: View Analytics Dashboard
- [ ] **Location**: Analytics page → Overview tab
- [ ] **SQL Terminal Should Show**: 
  ```sql
  LEFT JOIN songs_favorite ON songs_song.id = songs_favorite.song_id
  ```
- [ ] **Concepts**: LEFT JOIN, Outer joins

#### Multiple JOINs
- [ ] **Test**: View Top Artists (Analytics)
- [ ] **Location**: Analytics → Artists tab
- [ ] **SQL Terminal Should Show**: Multiple JOINs with users, songs, favorites, playlists
- [ ] **Concepts**: Multiple JOINs, Complex relationships

---

### 4. Aggregation Functions

#### COUNT
- [ ] **Test**: View song statistics
- [ ] **Location**: Analytics → Songs tab
- [ ] **SQL Terminal Should Show**: `COUNT(*) as total_songs`, `COUNT(DISTINCT ...)`
- [ ] **Concepts**: COUNT, DISTINCT

#### SUM
- [ ] **Test**: View total play count
- [ ] **Location**: Analytics → Overview tab
- [ ] **SQL Terminal Should Show**: `SUM(play_count)`
- [ ] **Concepts**: SUM aggregation

#### AVG
- [ ] **Test**: View average song duration
- [ ] **Location**: Analytics → Songs tab
- [ ] **SQL Terminal Should Show**: `AVG(duration)`
- [ ] **Concepts**: AVG aggregation

#### MIN/MAX
- [ ] **Test**: View song statistics
- [ ] **Location**: Analytics → Songs tab
- [ ] **SQL Terminal Should Show**: `MIN(duration)`, `MAX(play_count)`
- [ ] **Concepts**: MIN/MAX aggregation

---

### 5. GROUP BY and HAVING

#### GROUP BY
- [ ] **Test**: View songs by genre
- [ ] **Location**: Analytics → Songs tab
- [ ] **SQL Terminal Should Show**: 
  ```sql
  SELECT genre_id, COUNT(*) as count
  FROM songs_song
  GROUP BY genre_id
  ```
- [ ] **Concepts**: GROUP BY, Grouping data

#### HAVING Clause
- [ ] **Test**: View advanced song statistics
- [ ] **Location**: Analytics → Overview → Advanced Stats
- [ ] **SQL Terminal Should Show**: 
  ```sql
  GROUP BY genre_id
  HAVING COUNT(*) > 2
  ```
- [ ] **Concepts**: HAVING, Filtering grouped data

---

### 6. Subqueries

#### Scalar Subquery
- [ ] **Test**: View trending songs
- [ ] **Location**: Dashboard → Trending This Week section
- [ ] **SQL Terminal Should Show**: Subquery calculating average in SELECT
- [ ] **Concepts**: Scalar subquery, Nested SELECT

#### Subquery in WHERE
- [ ] **Test**: View user recommendations
- [ ] **Location**: Library → Recommendations
- [ ] **SQL Terminal Should Show**: 
  ```sql
  WHERE artist_id IN (SELECT artist_id FROM ...)
  ```
- [ ] **Concepts**: Subquery in WHERE, IN with subquery

#### Correlated Subquery
- [ ] **Test**: Advanced analytics queries
- [ ] **Location**: Analytics → SQL Concepts Demo
- [ ] **SQL Terminal Should Show**: Subquery referencing outer query
- [ ] **Concepts**: Correlated subquery

---

### 7. Common Table Expressions (CTEs)

#### Simple CTE
- [ ] **Test**: View raw SQL statistics
- [ ] **Location**: Analytics → Overview → Raw SQL Stats
- [ ] **SQL Terminal Should Show**: 
  ```sql
  WITH song_stats AS (
    SELECT genre_id, COUNT(*) as count ...
  )
  SELECT * FROM song_stats
  ```
- [ ] **Concepts**: CTE (WITH clause)

#### Multiple CTEs
- [ ] **Test**: View genre analysis
- [ ] **Location**: Analytics → Genres tab
- [ ] **SQL Terminal Should Show**: Multiple WITH clauses
- [ ] **Concepts**: Multiple CTEs, Complex queries

---

### 8. Window Functions

#### ROW_NUMBER()
- [ ] **Test**: View trending songs with rankings
- [ ] **Location**: Dashboard → Trending section
- [ ] **SQL Terminal Should Show**: `ROW_NUMBER() OVER (ORDER BY ...)`
- [ ] **Concepts**: Window functions, ROW_NUMBER

#### RANK() / DENSE_RANK()
- [ ] **Test**: View top artists
- [ ] **Location**: Analytics → Artists tab
- [ ] **SQL Terminal Should Show**: Ranking functions
- [ ] **Concepts**: RANK, DENSE_RANK

---

### 9. Advanced Filtering & Conditions

#### CASE Statements
- [ ] **Test**: View song statistics with categories
- [ ] **Location**: Analytics → Songs tab
- [ ] **SQL Terminal Should Show**: 
  ```sql
  CASE 
    WHEN play_count > 1000 THEN 'Popular'
    ELSE 'Normal'
  END
  ```
- [ ] **Concepts**: CASE, Conditional logic

#### COALESCE / NULLIF
- [ ] **Test**: View user profiles with default values
- [ ] **Location**: Profile page
- [ ] **SQL Terminal Should Show**: `COALESCE(display_name, username)`
- [ ] **Concepts**: NULL handling

---

### 10. Set Operations

#### UNION
- [ ] **Test**: View combined search results
- [ ] **Location**: Search with "All" category selected
- [ ] **SQL Terminal Should Show**: `SELECT ... UNION SELECT ...`
- [ ] **Concepts**: UNION, Set operations

---

### 11. Django ORM Advanced Features

#### F() Expressions
- [ ] **Test**: Increment play count
- [ ] **Location**: Play any song
- [ ] **SQL Terminal Should Show**: `UPDATE ... SET play_count = play_count + 1`
- [ ] **Concepts**: F() expressions, Atomic operations

#### Q() Objects (Complex Filters)
- [ ] **Test**: Advanced search with multiple conditions
- [ ] **Location**: Search with filters
- [ ] **SQL Terminal Should Show**: Complex WHERE with AND/OR
- [ ] **Concepts**: Q objects, Complex boolean logic

#### Prefetch/Select Related
- [ ] **Test**: View playlists with songs
- [ ] **Location**: Library → Playlists
- [ ] **SQL Terminal Should Show**: Optimized JOIN queries
- [ ] **Concepts**: Query optimization, N+1 prevention

#### Annotate/Aggregate
- [ ] **Test**: View analytics dashboard
- [ ] **Location**: Analytics → Any tab
- [ ] **SQL Terminal Should Show**: Annotated fields with aggregations
- [ ] **Concepts**: Annotate, Aggregate

---

## Testing Workflow

### Step 1: Start Services
```bash
# Terminal 1 - Backend
cd harmonydb-backend
python manage.py runserver

# Terminal 2 - Frontend
cd harmonydb-frontend
npm run dev
```

### Step 2: Open Application
1. Navigate to `http://localhost:5173`
2. Log in with your account
3. Open SQL Terminal (click SQL icon in header)

### Step 3: Systematic Testing

#### Phase 1: Basic CRUD (10 minutes)
- Dashboard page (READ)
- Upload a song (CREATE)
- Update profile (UPDATE)
- Delete a playlist (DELETE)
- **Check SQL Terminal** for all operations

#### Phase 2: Analytics Dashboard (15 minutes)
- Navigate to Analytics page
- Click through all 5 tabs:
  1. Overview - Shows aggregations, CTEs, subqueries
  2. Songs - GROUP BY, HAVING, aggregations
  3. Artists - Multiple JOINs, annotations
  4. Genres - Complex CTEs, window functions
  5. Trending - Date filtering, complex scoring
- **Monitor SQL Terminal** for concept badges

#### Phase 3: Search & Filters (10 minutes)
- Basic search (LIKE)
- Genre filters (IN)
- Date range (BETWEEN)
- Advanced search (Complex WHERE with Q objects)
- **Verify SQL Terminal** shows all query types

#### Phase 4: Dashboard Trending (5 minutes)
- View Dashboard page
- Scroll to "Trending This Week" section
- **Verify**: 
  - Trending songs appear with ranking numbers
  - SQL Terminal shows date filtering query
  - Label shows "SQL: Date Filtering, Complex Scoring..."

---

## SQL Terminal Features to Verify

### Query Classification
- [ ] **Basic Queries**: Labeled with blue badge
- [ ] **JOINs**: Labeled with green badge
- [ ] **Aggregations**: Labeled with yellow badge  
- [ ] **Subqueries**: Labeled with purple badge
- [ ] **Complex**: Labeled with red badge

### Filtering
- [ ] Filter by query type (All, JOINs, Aggregations, etc.)
- [ ] Search within queries
- [ ] Clear history button works

### Query Details
- [ ] Each query shows SQL statement
- [ ] Timing information displayed
- [ ] Concept badges visible
- [ ] Expandable view for long queries

---

## Expected Query Counts

After completing all tests, SQL Terminal should show approximately:
- **Total Queries**: 50-100+
- **JOINs**: 20-30
- **Aggregations**: 15-25
- **Subqueries**: 5-10
- **Complex**: 10-15

---

## Verification Checklist

### Backend Verification
- [ ] All 16 analytics endpoints return 200 status
- [ ] No server errors in Django console
- [ ] Database queries logged (if DEBUG=True)

### Frontend Verification
- [ ] All pages load without errors
- [ ] Analytics dashboard displays data
- [ ] Trending section appears on Dashboard
- [ ] Search with filters works
- [ ] SQL Terminal captures all queries

### SQL Concepts Coverage
- [ ] All 11 concept categories tested
- [ ] Each endpoint in analytics.py exercised
- [ ] SQL Terminal shows variety of query types

---

## Troubleshooting

### SQL Terminal Not Showing Queries
1. Check that SQL Debug context is enabled
2. Verify backend middleware is active
3. Check browser console for errors

### Analytics Endpoints Returning Errors
1. Verify database has sample data
2. Check Django logs for SQL errors
3. Ensure all migrations are applied: `python manage.py migrate`

### Trending Songs Not Appearing
1. Verify songs exist with recent activity (last 7 days)
2. Check browser Network tab for API response
3. Verify endpoint: `http://localhost:8000/api/analytics/songs/trending/`

### Search Filters Not Working
1. Check that advanced search endpoint is being called
2. Verify filter values are being sent in POST body
3. Check SQL Terminal for query with filters

---

## Success Criteria

✅ **You have successfully demonstrated all SQL concepts when:**

1. SQL Terminal shows queries from all 11 concept categories
2. All analytics tabs display data without errors
3. Dashboard shows trending songs with rankings
4. Search works with all filter combinations
5. CRUD operations visible in SQL Terminal
6. No TypeScript or Python errors in consoles
7. SQL concept badges appear correctly in terminal
8. All checkboxes in this guide are marked complete

---

## Additional Notes

### For Course Evaluation
- **Screenshot Evidence**: Capture SQL Terminal showing different query types
- **Analytics Dashboard**: Show all 5 tabs with data
- **Trending Section**: Demonstrate date-based filtering
- **Search Filters**: Show IN, LIKE, BETWEEN usage
- **Code Review**: Point to analytics.py for SQL implementations

### SQL Concepts Documentation
Each analytics endpoint documents which SQL concepts it demonstrates:
- See `harmonydb-backend/songs/analytics.py` for implementation details
- See `harmonydb-backend/songs/urls_analytics.py` for endpoint mapping
- See `AI_IMPLEMENTATION.md` for comprehensive overview

---

## Quick Test Commands

### Backend Health Check
```bash
# Test analytics endpoints
curl http://localhost:8000/api/analytics/songs/statistics/
curl http://localhost:8000/api/analytics/artists/top/
curl http://localhost:8000/api/analytics/songs/trending/
```

### Database Query Check
```bash
# Django shell
python manage.py shell

# Test analytics functions
from songs.analytics import SongAnalytics
analytics = SongAnalytics()
print(analytics.get_song_statistics())
```

---

## Conclusion

This guide ensures comprehensive testing of all SQL concepts implemented in HarmonyDB. Follow the checklist systematically, monitor the SQL Terminal, and verify that all query types are properly classified and displayed.

**Remember**: The goal is to demonstrate mastery of SQL concepts through a real-world application with proper architecture and best practices! 🎯
