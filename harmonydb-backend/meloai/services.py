import os
import json
import requests
from django.conf import settings
from django.db.models import Q
from songs.models import Song, Album, Genre
from users.models import User


class GroqAIService:
    """Service to interact with Groq API for natural language processing"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1"
        
    def process_music_query(self, user_query: str) -> dict:
        """
        Process user's natural language query and convert it to structured data
        Returns: {
            'intent': str,  # 'search_songs', 'search_albums', 'search_artists', 'get_recommendations'
            'entities': dict,  # extracted information like artist_name, genre, etc.
            'sql_query': str,  # suggested SQL query
            'natural_response': str  # AI's natural language response
        }
        """
        if not self.api_key:
            return self._fallback_processing(user_query)
            
        try:
            # Create a structured prompt for the AI
            prompt = self._create_music_prompt(user_query)
            
            # Call Groq API
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",  # or "mixtral-8x7b-32768"
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a music database assistant. Parse user queries and return structured JSON responses for music searches."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500
                },
                timeout=10
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content = ai_response['choices'][0]['message']['content']
                return self._parse_ai_response(content, user_query)
            else:
                return self._fallback_processing(user_query)
                
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_processing(user_query)
    
    def _create_music_prompt(self, user_query: str) -> str:
        """Create a structured prompt for the AI with comprehensive DBMS concept support"""
        return f"""
        You are a music database assistant that understands DBMS concepts. Parse user queries and extract relevant information for database operations.

        DBMS Concept Examples:
        - "Give me all songs by The Weeknd" -> {{"intent": "search_songs", "entities": {{"artist_name": "The Weeknd"}}, "dbms_concept": "basic_query"}}
        - "How many songs are in Rock genre?" -> {{"intent": "get_aggregation", "entities": {{"genre": "rock", "aggregation_type": "count"}}, "dbms_concept": "aggregation"}}
        - "Show top 5 most played songs" -> {{"intent": "search_songs", "entities": {{"limit": 5, "order_by": "play_count"}}, "dbms_concept": "sorting_limiting"}}
        - "Find average play count in genre Pop" -> {{"intent": "get_aggregation", "entities": {{"genre": "pop", "aggregation_type": "avg", "field": "play_count"}}, "dbms_concept": "aggregation"}}
        - "List all songs and their album titles" -> {{"intent": "get_joined_data", "entities": {{"join_type": "songs_albums"}}, "dbms_concept": "joins"}}
        - "Show album with most songs" -> {{"intent": "get_subquery_result", "entities": {{"subquery_type": "max_songs_album"}}, "dbms_concept": "subqueries"}}
        - "Find songs added in last 30 days" -> {{"intent": "search_songs", "entities": {{"date_range": "last_30_days"}}, "dbms_concept": "date_filtering"}}
        - "Search songs with title containing Love" -> {{"intent": "search_songs", "entities": {{"song_title_pattern": "Love"}}, "dbms_concept": "text_search"}}
        - "Show total songs by each artist" -> {{"intent": "get_grouped_aggregation", "entities": {{"group_by": "artist", "aggregation_type": "count"}}, "dbms_concept": "group_by_aggregation"}}
        - "Show all my favorite songs" -> {{"intent": "get_user_favorites", "entities": {{"favorite_type": "songs"}}, "dbms_concept": "user_specific_query"}}
        - "Show all my favorite artists" -> {{"intent": "get_user_favorites", "entities": {{"favorite_type": "artists"}}, "dbms_concept": "user_specific_query"}}
        - "Show all my favorite albums" -> {{"intent": "get_user_favorites", "entities": {{"favorite_type": "albums"}}, "dbms_concept": "user_specific_query"}}
        - "Show my listening history" -> {{"intent": "get_user_history", "entities": {{}}, "dbms_concept": "user_specific_query"}}
        - "My most played songs" -> {{"intent": "get_user_stats", "entities": {{"stat_type": "most_played"}}, "dbms_concept": "user_specific_query"}}
        - "Songs I played recently" -> {{"intent": "get_user_history", "entities": {{"time_range": "recent"}}, "dbms_concept": "user_specific_query"}}
        - "Albums released this year" -> {{"intent": "search_albums", "entities": {{"year": "current_year"}}, "dbms_concept": "date_filtering"}}
        - "Artists from genre Rock" -> {{"intent": "search_artists", "entities": {{"genre": "rock"}}, "dbms_concept": "basic_query"}}

        Parse this query and return ONLY valid JSON with this exact structure:
        {{
            "intent": "search_songs|search_albums|search_artists|get_aggregation|get_joined_data|get_subquery_result|get_grouped_aggregation|get_recommendations|get_stats|get_user_favorites|get_user_history|get_user_stats|create_view|demonstrate_transaction",
            "entities": {{
                "artist_name": "extracted artist name or null",
                "song_title": "extracted song title or null",
                "song_title_pattern": "pattern for text search or null",
                "album_title": "extracted album title or null",
                "genre": "extracted genre or null",
                "year": "extracted year or null",
                "date_range": "last_30_days|last_year|after_2020|before_2010|current_year or null",
                "play_count_filter": "high|medium|low or null",
                "play_count_threshold": "numeric threshold or null",
                "limit": "number for LIMIT clause or null",
                "order_by": "field to order by or null",
                "aggregation_type": "count|avg|max|min|sum or null",
                "field": "field to aggregate or null",
                "group_by": "field to group by or null",
                "join_type": "songs_albums|songs_artists|albums_artists|full_data or null",
                "subquery_type": "max_songs_album|most_popular_artist|albums_with_many_songs or null",
                "comparison_operator": "gt|lt|gte|lte|eq or null",
                "favorite_type": "songs|artists|albums or null",
                "stat_type": "most_played|recently_added|top_genres or null",
                "time_range": "recent|today|this_week|this_month or null"
            }},
            "dbms_concept": "basic_query|aggregation|joins|subqueries|sorting_limiting|date_filtering|text_search|group_by_aggregation|user_specific_query|normalization|transactions|indexing|views|triggers|constraints",
            "natural_response": "A brief response about what database operation will be performed"
        }}
        
        User Query: "{user_query}"
        
        Return ONLY valid JSON, no additional text or formatting.
        """
    
    def _parse_ai_response(self, ai_content: str, original_query: str) -> dict:
        """Parse AI response and structure the data"""
        try:
            # Try to extract JSON from the response
            json_start = ai_content.find('{')
            json_end = ai_content.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = ai_content[json_start:json_end]
                parsed_data = json.loads(json_str)
                
                # Add SQL query generation
                parsed_data['sql_query'] = self._generate_sql_query(parsed_data.get('entities', {}))
                return parsed_data
            else:
                return self._fallback_processing(original_query)
                
        except json.JSONDecodeError:
            return self._fallback_processing(original_query)
    
    def _generate_sql_query(self, entities: dict) -> str:
        """Generate SQL query based on extracted entities"""
        conditions = []
        
        if entities.get('artist_name'):
            conditions.append(f"artist__username ICONTAINS '{entities['artist_name']}'")
        if entities.get('song_title'):
            conditions.append(f"title ICONTAINS '{entities['song_title']}'")
        if entities.get('album_title'):
            conditions.append(f"album__title ICONTAINS '{entities['album_title']}'")
        if entities.get('genre'):
            conditions.append(f"genre__name ICONTAINS '{entities['genre']}'")
        if entities.get('year'):
            conditions.append(f"release_date__year = {entities['year']}")
        if entities.get('play_count_filter'):
            if entities['play_count_filter'] == 'high':
                conditions.append("play_count > 100")
            elif entities['play_count_filter'] == 'medium':
                conditions.append("play_count BETWEEN 10 AND 100")
            elif entities['play_count_filter'] == 'low':
                conditions.append("play_count < 10")
        
        if conditions:
            where_clause = " AND ".join(conditions)
            return f"SELECT * FROM songs_song WHERE {where_clause} AND approved = True ORDER BY play_count DESC LIMIT 20"
        else:
            return "SELECT * FROM songs_song WHERE approved = True ORDER BY play_count DESC LIMIT 20"
    
    def _fallback_processing(self, user_query: str) -> dict:
        """Enhanced fallback processing for DBMS concepts when AI API is not available"""
        query_lower = user_query.lower()
        
        # Enhanced intent detection for DBMS concepts
        if any(word in query_lower for word in ['my favorite', 'my favourites', 'favorite songs', 'favorite artists', 'favorite albums', 'favourites']):
            if 'songs' in query_lower or 'track' in query_lower:
                intent = 'get_user_favorites'
                entities['favorite_type'] = 'songs'
            elif 'artists' in query_lower or 'singer' in query_lower:
                intent = 'get_user_favorites' 
                entities['favorite_type'] = 'artists'
            elif 'albums' in query_lower or 'album' in query_lower:
                intent = 'get_user_favorites'
                entities['favorite_type'] = 'albums'
            else:
                intent = 'get_user_favorites'
                entities['favorite_type'] = 'songs'  # default
        elif any(word in query_lower for word in ['my history', 'listening history', 'recently played', 'songs i played']):
            intent = 'get_user_history'
            if 'recent' in query_lower or 'recently' in query_lower:
                entities['time_range'] = 'recent'
        elif any(word in query_lower for word in ['my most played', 'my top', 'my stats']):
            intent = 'get_user_stats'
            entities['stat_type'] = 'most_played'
        elif any(word in query_lower for word in ['how many', 'count', 'total number', 'average', 'avg', 'maximum', 'minimum', 'sum']):
            if 'average' in query_lower or 'avg' in query_lower:
                intent = 'get_aggregation'
                aggregation_type = 'avg'
            elif 'count' in query_lower or 'how many' in query_lower or 'total number' in query_lower:
                intent = 'get_aggregation' 
                aggregation_type = 'count'
            elif 'maximum' in query_lower or 'highest' in query_lower or 'max' in query_lower:
                intent = 'get_aggregation'
                aggregation_type = 'max'
            elif 'minimum' in query_lower or 'lowest' in query_lower or 'min' in query_lower:
                intent = 'get_aggregation'
                aggregation_type = 'min'
            elif 'sum' in query_lower or 'total' in query_lower:
                intent = 'get_aggregation'
                aggregation_type = 'sum'
            else:
                intent = 'get_aggregation'
                aggregation_type = 'count'
        elif any(word in query_lower for word in ['join', 'with their', 'and their', 'corresponding', 'along with']):
            intent = 'get_joined_data'
        elif any(word in query_lower for word in ['most', 'highest number', 'album with', 'artist with']) and not any(word in query_lower for word in ['top', 'first']):
            intent = 'get_subquery_result'
        elif any(word in query_lower for word in ['by each', 'group by', 'per artist', 'per album', 'per genre', 'distribution']):
            intent = 'get_grouped_aggregation'
        elif any(word in query_lower for word in ['top', 'first', 'show me 5', 'show me 10', 'most played']):
            intent = 'search_songs'
        elif any(word in query_lower for word in ['last 30 days', 'recent', 'recently', 'after 20', 'before 20', 'in year']):
            if 'albums' in query_lower or 'album' in query_lower:
                intent = 'search_albums'
            else:
                intent = 'search_songs'
        elif any(word in query_lower for word in ['containing', 'matches', 'search for', 'find songs with']):
            intent = 'search_songs'
        elif any(word in query_lower for word in ['album', 'record']) and not any(word in query_lower for word in ['songs', 'tracks']):
            intent = 'search_albums'
        elif any(word in query_lower for word in ['artist', 'singer', 'band']):
            intent = 'search_artists'
        else:
            intent = 'search_songs'
        
        # Enhanced entity extraction
        entities = {}
        import re
        
        # Extract aggregation details
        if intent == 'get_aggregation':
            entities['aggregation_type'] = aggregation_type
            if 'play count' in query_lower or 'plays' in query_lower:
                entities['field'] = 'play_count'
            elif 'duration' in query_lower:
                entities['field'] = 'duration'
        
        # Extract grouping information
        if intent == 'get_grouped_aggregation':
            if 'by artist' in query_lower or 'per artist' in query_lower or 'by each artist' in query_lower:
                entities['group_by'] = 'artist'
                entities['aggregation_type'] = 'count'
            elif 'by album' in query_lower or 'per album' in query_lower:
                entities['group_by'] = 'album'
                entities['aggregation_type'] = 'count'
            elif 'by genre' in query_lower or 'per genre' in query_lower or 'genre distribution' in query_lower:
                entities['group_by'] = 'genre'
                entities['aggregation_type'] = 'count'
        
        # Extract join type
        if intent == 'get_joined_data':
            if 'songs' in query_lower and 'album' in query_lower:
                entities['join_type'] = 'songs_albums'
            elif 'songs' in query_lower and 'artist' in query_lower:
                entities['join_type'] = 'songs_artists'
            elif 'album' in query_lower and 'artist' in query_lower:
                entities['join_type'] = 'albums_artists'
            else:
                entities['join_type'] = 'full_data'
        
        # Extract subquery type
        if intent == 'get_subquery_result':
            if 'album with' in query_lower and ('most songs' in query_lower or 'highest number' in query_lower):
                entities['subquery_type'] = 'max_songs_album'
            elif 'artist with' in query_lower and ('most' in query_lower or 'popular' in query_lower):
                entities['subquery_type'] = 'most_popular_artist'
            elif 'albums' in query_lower and ('more than' in query_lower or 'many songs' in query_lower):
                entities['subquery_type'] = 'albums_with_many_songs'
        
        # Extract artist names with common patterns (but avoid false positives)
        if intent in ['search_songs', 'search_albums', 'search_artists']:
            artist_patterns = [
                r"(?:songs|music|tracks)\s+(?:by|of|from)\s+([^,.!?]+)",
                r"(?:find|show|get)\s+(?:me\s+)?(?:all\s+)?(?:songs|music|tracks)\s+(?:by|of|from)\s+([^,.!?]+)",
                r"([a-zA-Z\s]+?)(?:'s|s')\s+(?:songs|music|tracks)",
                r"(?:artist|singer|band)\s+([^,.!?]+)",
                r"(?:listen to|play)\s+([^,.!?]+)",
            ]
            
            for pattern in artist_patterns:
                match = re.search(pattern, query_lower, re.IGNORECASE)
                if match:
                    artist_name = match.group(1).strip()
                    # Preserve definite/indefinite articles (e.g., 'The Weeknd') to match stage names
                    entities['artist_name'] = artist_name.title()
                    break
        
        # Extract genres
        common_genres = ['rock', 'pop', 'hip hop', 'rap', 'jazz', 'classical', 'electronic', 'country', 'blues', 'reggae', 'folk', 'punk', 'metal']
        for genre in common_genres:
            if genre in query_lower:
                entities['genre'] = genre
                break
        
        # Extract date ranges
        if 'last 30 days' in query_lower or 'past month' in query_lower:
            entities['date_range'] = 'last_30_days'
        elif 'last year' in query_lower or 'past year' in query_lower:
            entities['date_range'] = 'last_year'
        elif 'after 2020' in query_lower:
            entities['date_range'] = 'after_2020'
        elif 'before 2010' in query_lower:
            entities['date_range'] = 'before_2010'
        elif 'this year' in query_lower or 'current year' in query_lower:
            entities['date_range'] = 'current_year'
        
        # Extract limits for top queries
        limit_match = re.search(r'(?:top|first|show me)\s+(\d+)', query_lower)
        if limit_match:
            entities['limit'] = int(limit_match.group(1))
        elif 'top' in query_lower and 'most played' in query_lower:
            entities['limit'] = 10  # default for "top most played"
            entities['order_by'] = 'play_count'
        
        # Extract play count thresholds
        threshold_match = re.search(r'more than (\d+)', query_lower)
        if threshold_match:
            entities['play_count_threshold'] = int(threshold_match.group(1))
            entities['comparison_operator'] = 'gt'
        
        threshold_match = re.search(r'less than (\d+)', query_lower)
        if threshold_match:
            entities['play_count_threshold'] = int(threshold_match.group(1))
            entities['comparison_operator'] = 'lt'
        
        # Extract text search patterns
        if 'containing' in query_lower or 'with title' in query_lower or 'matches' in query_lower:
            # Try to extract the search term
            patterns = [
                r"containing\s+['\"]([^'\"]+)['\"]",
                r"containing\s+(\w+)",
                r"with title\s+['\"]([^'\"]+)['\"]",
                r"matches\s+['\"]([^'\"]+)['\"]",
                r"matches\s+(\w+)"
            ]
            for pattern in patterns:
                match = re.search(pattern, query_lower)
                if match:
                    entities['song_title_pattern'] = match.group(1)
                    break
        
        # Try to extract quoted terms as exact matches
        quoted_terms = re.findall(r'"([^"]*)"', user_query)
        if quoted_terms and not entities.get('artist_name') and not entities.get('song_title_pattern'):
            if intent == 'search_songs':
                entities['song_title'] = quoted_terms[0]
            elif intent == 'search_albums':
                entities['album_title'] = quoted_terms[0]
            elif intent == 'search_artists':
                entities['artist_name'] = quoted_terms[0]
        
        # Determine DBMS concept
        dbms_concept = 'basic_query'
        if intent in ['get_user_favorites', 'get_user_history', 'get_user_stats']:
            dbms_concept = 'user_specific_query'
        elif intent == 'get_aggregation':
            dbms_concept = 'aggregation'
        elif intent == 'get_joined_data':
            dbms_concept = 'joins'
        elif intent == 'get_subquery_result':
            dbms_concept = 'subqueries'
        elif intent == 'get_grouped_aggregation':
            dbms_concept = 'group_by_aggregation'
        elif entities.get('date_range'):
            dbms_concept = 'date_filtering'
        elif entities.get('song_title_pattern'):
            dbms_concept = 'text_search'
        elif entities.get('limit'):
            dbms_concept = 'sorting_limiting'
        
        return {
            'intent': intent,
            'entities': entities,
            'dbms_concept': dbms_concept,
            'sql_query': self._generate_sql_query(entities),
            'natural_response': f"I'll perform a {dbms_concept.replace('_', ' ')} operation based on your query: {user_query}"
        }


class MusicQueryProcessor:
    """Process the structured AI response and execute database queries"""
    
    @staticmethod
    def execute_query(ai_response: dict, user, request=None) -> dict:
        """Execute the database query based on AI response with comprehensive DBMS concept support"""
        intent = ai_response.get('intent', 'search_songs')
        entities = ai_response.get('entities', {})
        dbms_concept = ai_response.get('dbms_concept', 'basic_query')
        
        try:
            if intent == 'search_songs':
                results = MusicQueryProcessor._search_songs(entities, request)
                result_type = 'songs'
            elif intent == 'search_albums':
                results = MusicQueryProcessor._search_albums(entities, request)
                result_type = 'albums'
            elif intent == 'search_artists':
                results = MusicQueryProcessor._search_artists(entities, request)
                result_type = 'artists'
            elif intent == 'get_aggregation':
                results = MusicQueryProcessor._get_aggregation(entities, request)
                result_type = 'aggregation'
            elif intent == 'get_joined_data':
                results = MusicQueryProcessor._get_joined_data(entities, request)
                result_type = 'joined_data'
            elif intent == 'get_subquery_result':
                results = MusicQueryProcessor._get_subquery_result(entities, request)
                result_type = 'subquery_result'
            elif intent == 'get_grouped_aggregation':
                results = MusicQueryProcessor._get_grouped_aggregation(entities, request)
                result_type = 'grouped_aggregation'
            elif intent == 'get_user_favorites':
                results = MusicQueryProcessor._get_user_favorites(entities, user, request)
                result_type = 'user_favorites'
            elif intent == 'get_user_history':
                results = MusicQueryProcessor._get_user_history(entities, user, request)
                result_type = 'user_history'
            elif intent == 'get_user_stats':
                results = MusicQueryProcessor._get_user_stats_detailed(entities, user, request)
                result_type = 'user_stats'
            elif intent == 'get_stats':
                results = MusicQueryProcessor._get_user_stats(user)
                result_type = 'stats'
            else:
                results = MusicQueryProcessor._search_songs(entities, request)
                result_type = 'songs'
            
            return {
                'success': True,
                'result_type': result_type,
                'results': results,
                'count': len(results) if isinstance(results, list) else 1,
                'ai_response': ai_response.get('natural_response', ''),
                'sql_query': ai_response.get('sql_query', ''),
                'dbms_concept': dbms_concept
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'result_type': 'error',
                'results': [],
                'count': 0,
                'ai_response': f"Sorry, I encountered an error while processing this {dbms_concept.replace('_', ' ')} query: {str(e)}",
                'sql_query': ai_response.get('sql_query', ''),
                'dbms_concept': dbms_concept
            }
    
    @staticmethod
    def _search_songs(entities: dict, request=None) -> list:
        """Enhanced search for songs with DBMS concept support"""
        from django.utils import timezone
        from datetime import timedelta
        
        queryset = Song.objects.filter(approved=True)
        
        # Artist filtering with multiple field support
        if entities.get('artist_name'):
            artist_q = Q(artist__username__icontains=entities['artist_name']) | \
                       Q(artist__stage_name__icontains=entities['artist_name']) | \
                       Q(artist__first_name__icontains=entities['artist_name']) | \
                       Q(artist__last_name__icontains=entities['artist_name'])
            queryset = queryset.filter(artist_q)
        
        # Title filtering (exact and pattern matching)
        if entities.get('song_title'):
            queryset = queryset.filter(title__icontains=entities['song_title'])
        elif entities.get('song_title_pattern'):
            queryset = queryset.filter(title__icontains=entities['song_title_pattern'])
        
        # Album filtering
        if entities.get('album_title'):
            queryset = queryset.filter(album__title__icontains=entities['album_title'])
        
        # Genre filtering
        if entities.get('genre'):
            queryset = queryset.filter(genre__name__icontains=entities['genre'])
        
        # Year filtering
        if entities.get('year'):
            queryset = queryset.filter(release_date__year=entities['year'])
        
        # Date range filtering (DBMS concept: date/time queries)
        if entities.get('date_range'):
            now = timezone.now()
            if entities['date_range'] == 'last_30_days':
                start_date = now - timedelta(days=30)
                queryset = queryset.filter(upload_date__gte=start_date)
            elif entities['date_range'] == 'last_year':
                start_date = now - timedelta(days=365)
                queryset = queryset.filter(upload_date__gte=start_date)
            elif entities['date_range'] == 'after_2020':
                queryset = queryset.filter(release_date__year__gt=2020)
            elif entities['date_range'] == 'before_2010':
                queryset = queryset.filter(release_date__year__lt=2010)
            elif entities['date_range'] == 'current_year':
                queryset = queryset.filter(release_date__year=now.year)
        
        # Play count filtering with threshold support
        if entities.get('play_count_filter'):
            if entities['play_count_filter'] == 'high':
                queryset = queryset.filter(play_count__gt=100)
            elif entities['play_count_filter'] == 'medium':
                queryset = queryset.filter(play_count__range=(10, 100))
            elif entities['play_count_filter'] == 'low':
                queryset = queryset.filter(play_count__lt=10)
        
        # Threshold-based filtering
        if entities.get('play_count_threshold') and entities.get('comparison_operator'):
            threshold = entities['play_count_threshold']
            op = entities['comparison_operator']
            if op == 'gt':
                queryset = queryset.filter(play_count__gt=threshold)
            elif op == 'lt':
                queryset = queryset.filter(play_count__lt=threshold)
            elif op == 'gte':
                queryset = queryset.filter(play_count__gte=threshold)
            elif op == 'lte':
                queryset = queryset.filter(play_count__lte=threshold)
            elif op == 'eq':
                queryset = queryset.filter(play_count=threshold)
        
        # Ordering (DBMS concept: sorting)
        order_by = '-play_count'  # default
        if entities.get('order_by'):
            if entities['order_by'] == 'play_count':
                order_by = '-play_count'
            elif entities['order_by'] == 'release_date':
                order_by = '-release_date'
            elif entities['order_by'] == 'title':
                order_by = 'title'
            elif entities['order_by'] == 'duration':
                order_by = '-duration'
        
        queryset = queryset.select_related('artist', 'album', 'genre').order_by(order_by)
        
        # Limiting (DBMS concept: LIMIT clause)
        limit = entities.get('limit', 20)
        songs = queryset[:limit]

        results = []
        for song in songs:
            # Build absolute URLs when request is provided so frontend can load media cross-origin
            cover_url = None
            if song.cover_image:
                try:
                    cover_url = request.build_absolute_uri(song.cover_image.url) if request else song.cover_image.url
                except Exception:
                    cover_url = song.cover_image.url
            elif song.album and getattr(song.album, 'cover_image', None):
                try:
                    cover_url = request.build_absolute_uri(song.album.cover_image.url) if request else song.album.cover_image.url
                except Exception:
                    cover_url = song.album.cover_image.url

            audio_url = None
            try:
                audio_url = request.build_absolute_uri(f"/api/songs/stream/{song.id}/") if request else f"/api/songs/stream/{song.id}/"
            except Exception:
                audio_url = f"/api/songs/stream/{song.id}/"

            results.append({
                'id': song.id,
                'title': song.title,
                'artist_name': song.artist.stage_name or song.artist.username,
                'artist_id': song.artist.id,
                'album': song.album.title if song.album else None,
                'album_id': song.album.id if song.album else None,
                'genre': song.genre.name if song.genre else None,
                'cover_image': cover_url,
                'audio_url': audio_url,
                'play_count': song.play_count,
                'duration': song.duration,
                'release_date': song.release_date.isoformat() if song.release_date else None,
                'upload_date': song.upload_date.isoformat() if song.upload_date else None
            })

        return results
    
    @staticmethod
    def _search_albums(entities: dict, request=None) -> list:
        """Search for albums based on entities"""
        queryset = Album.objects.all()
        
        if entities.get('artist_name'):
            queryset = queryset.filter(
                Q(artist__username__icontains=entities['artist_name']) |
                Q(artist__stage_name__icontains=entities['artist_name'])
            )
        if entities.get('album_title'):
            queryset = queryset.filter(title__icontains=entities['album_title'])
        if entities.get('year'):
            queryset = queryset.filter(release_date__year=entities['year'])
        
        albums = queryset.select_related('artist').prefetch_related('songs')[:20]

        results = []
        for album in albums:
            cover_url = None
            if album.cover_image:
                try:
                    cover_url = request.build_absolute_uri(album.cover_image.url) if request else album.cover_image.url
                except Exception:
                    cover_url = album.cover_image.url

            results.append({
                'id': album.id,
                'title': album.title,
                'artist_name': album.artist.stage_name or album.artist.username,
                'artist_id': album.artist.id,
                'cover_image': cover_url,
                'release_date': album.release_date.isoformat() if album.release_date else None,
                'songs_count': album.songs.filter(approved=True).count(),
                'created_at': album.created_at.isoformat()
            })

        return results
    
    @staticmethod
    def _search_artists(entities: dict, request=None) -> list:
        """Search for artists based on entities"""
        queryset = User.objects.filter(role='artist')
        
        if entities.get('artist_name'):
            queryset = queryset.filter(
                Q(username__icontains=entities['artist_name']) |
                Q(stage_name__icontains=entities['artist_name'])
            )
        
        artists = queryset.prefetch_related('songs', 'albums')[:20]

        results = []
        for artist in artists:
            pic_url = None
            if artist.profile_picture:
                try:
                    pic_url = request.build_absolute_uri(artist.profile_picture.url) if request else artist.profile_picture.url
                except Exception:
                    pic_url = artist.profile_picture.url

            results.append({
                'id': artist.id,
                'username': artist.username,
                'stage_name': artist.stage_name or artist.username,
                'profile_picture': pic_url,
                'bio': artist.bio,
                'songs_count': artist.songs.filter(approved=True).count(),
                'albums_count': artist.albums.count(),
                'created_at': artist.created_at.isoformat()
            })

        return results
    
    @staticmethod
    def _get_user_stats(user) -> dict:
        """Get user's music statistics"""
        if user.role == 'artist':
            songs_count = user.songs.filter(approved=True).count()
            albums_count = user.albums.count()
            total_plays = sum(song.play_count for song in user.songs.filter(approved=True))
            
            return {
                'user_type': 'artist',
                'songs_created': songs_count,
                'albums_created': albums_count,
                'total_plays': total_plays,
                'average_plays': round(total_plays / songs_count, 2) if songs_count > 0 else 0
            }
        else:
            favorites_count = user.favorites.count()
            playlists_count = user.playlists.count()
            listening_history_count = user.listening_history.count()
            
            return {
                'user_type': 'listener',
                'favorites_count': favorites_count,
                'playlists_count': playlists_count,
                'songs_played': listening_history_count
            }
    
    @staticmethod
    def _get_aggregation(entities: dict, request=None) -> dict:
        """Handle aggregation queries (DBMS concept: Aggregate Functions)"""
        from django.db.models import Count, Avg, Max, Min, Sum
        
        aggregation_type = entities.get('aggregation_type', 'count')
        field = entities.get('field', 'id')
        
        queryset = Song.objects.filter(approved=True)
        
        # Apply filters before aggregation
        if entities.get('genre'):
            queryset = queryset.filter(genre__name__icontains=entities['genre'])
        if entities.get('artist_name'):
            artist_q = Q(artist__username__icontains=entities['artist_name']) | \
                       Q(artist__stage_name__icontains=entities['artist_name'])
            queryset = queryset.filter(artist_q)
        if entities.get('album_title'):
            queryset = queryset.filter(album__title__icontains=entities['album_title'])
        
        # Perform aggregation
        if aggregation_type == 'count':
            result = queryset.count()
            label = f"Total {field.replace('_', ' ')}"
        elif aggregation_type == 'avg' and field == 'play_count':
            result = queryset.aggregate(avg_plays=Avg('play_count'))['avg_plays']
            result = round(result, 2) if result else 0
            label = "Average play count"
        elif aggregation_type == 'max' and field == 'play_count':
            result = queryset.aggregate(max_plays=Max('play_count'))['max_plays']
            result = result if result else 0
            label = "Maximum play count"
        elif aggregation_type == 'min' and field == 'play_count':
            result = queryset.aggregate(min_plays=Min('play_count'))['min_plays']
            result = result if result else 0
            label = "Minimum play count"
        elif aggregation_type == 'sum' and field == 'play_count':
            result = queryset.aggregate(sum_plays=Sum('play_count'))['sum_plays']
            result = result if result else 0
            label = "Total play count"
        else:
            result = queryset.count()
            label = "Count"
        
        return {
            'aggregation_type': aggregation_type,
            'field': field,
            'result': result,
            'label': label,
            'query_description': f"Performed {aggregation_type.upper()} aggregation on {field}"
        }
    
    @staticmethod
    def _get_joined_data(entities: dict, request=None) -> list:
        """Handle join queries (DBMS concept: JOINs)"""
        join_type = entities.get('join_type', 'songs_albums')
        
        if join_type == 'songs_albums':
            # JOIN songs with albums
            songs = Song.objects.filter(approved=True).select_related('album', 'artist')[:20]
            results = []
            for song in songs:
                cover_url = None
                if song.cover_image and request:
                    try:
                        cover_url = request.build_absolute_uri(song.cover_image.url)
                    except:
                        cover_url = song.cover_image.url
                elif song.cover_image:
                    cover_url = song.cover_image.url
                
                results.append({
                    'song_title': song.title,
                    'song_id': song.id,
                    'album_title': song.album.title if song.album else 'No Album',
                    'album_id': song.album.id if song.album else None,
                    'artist_name': song.artist.stage_name or song.artist.username,
                    'cover_image': cover_url,
                    'play_count': song.play_count,
                    'release_date': song.release_date.isoformat() if song.release_date else None
                })
            return results
            
        elif join_type == 'albums_artists':
            # JOIN albums with artists
            albums = Album.objects.all().select_related('artist')[:20]
            results = []
            for album in albums:
                cover_url = None
                if album.cover_image and request:
                    try:
                        cover_url = request.build_absolute_uri(album.cover_image.url)
                    except:
                        cover_url = album.cover_image.url
                elif album.cover_image:
                    cover_url = album.cover_image.url
                
                results.append({
                    'album_title': album.title,
                    'album_id': album.id,
                    'artist_name': album.artist.stage_name or album.artist.username,
                    'artist_id': album.artist.id,
                    'cover_image': cover_url,
                    'release_date': album.release_date.isoformat() if album.release_date else None,
                    'songs_count': album.songs.filter(approved=True).count()
                })
            return results
        
        else:
            # Default: full data join
            return MusicQueryProcessor._search_songs(entities, request)
    
    @staticmethod
    def _get_subquery_result(entities: dict, request=None) -> list:
        """Handle subquery operations (DBMS concept: Subqueries)"""
        from django.db.models import Count
        
        subquery_type = entities.get('subquery_type', 'max_songs_album')
        
        if subquery_type == 'max_songs_album':
            # Find album with the highest number of songs
            album = Album.objects.annotate(
                song_count=Count('songs', filter=Q(songs__approved=True))
            ).order_by('-song_count').first()
            
            if album:
                cover_url = None
                if album.cover_image and request:
                    try:
                        cover_url = request.build_absolute_uri(album.cover_image.url)
                    except:
                        cover_url = album.cover_image.url
                elif album.cover_image:
                    cover_url = album.cover_image.url
                
                return [{
                    'album_title': album.title,
                    'album_id': album.id,
                    'artist_name': album.artist.stage_name or album.artist.username,
                    'songs_count': album.song_count,
                    'cover_image': cover_url,
                    'release_date': album.release_date.isoformat() if album.release_date else None,
                    'query_description': 'Album with the highest number of songs'
                }]
        
        elif subquery_type == 'most_popular_artist':
            # Find artist with highest total play count
            from django.db.models import Sum
            artist = User.objects.filter(role='artist').annotate(
                total_plays=Sum('songs__play_count', filter=Q(songs__approved=True))
            ).order_by('-total_plays').first()
            
            if artist:
                pic_url = None
                if artist.profile_picture and request:
                    try:
                        pic_url = request.build_absolute_uri(artist.profile_picture.url)
                    except:
                        pic_url = artist.profile_picture.url
                elif artist.profile_picture:
                    pic_url = artist.profile_picture.url
                
                return [{
                    'artist_name': artist.stage_name or artist.username,
                    'artist_id': artist.id,
                    'total_plays': artist.total_plays or 0,
                    'songs_count': artist.songs.filter(approved=True).count(),
                    'profile_picture': pic_url,
                    'query_description': 'Artist with the most popular songs based on play count'
                }]
        
        elif subquery_type == 'albums_with_many_songs':
            # Find albums with more than a certain number of songs
            threshold = entities.get('play_count_threshold', 5)
            albums = Album.objects.annotate(
                song_count=Count('songs', filter=Q(songs__approved=True))
            ).filter(song_count__gt=threshold).order_by('-song_count')[:10]
            
            results = []
            for album in albums:
                cover_url = None
                if album.cover_image and request:
                    try:
                        cover_url = request.build_absolute_uri(album.cover_image.url)
                    except:
                        cover_url = album.cover_image.url
                elif album.cover_image:
                    cover_url = album.cover_image.url
                
                results.append({
                    'album_title': album.title,
                    'album_id': album.id,
                    'artist_name': album.artist.stage_name or album.artist.username,
                    'songs_count': album.song_count,
                    'cover_image': cover_url,
                    'release_date': album.release_date.isoformat() if album.release_date else None
                })
            return results
        
        return []
    
    @staticmethod
    def _get_grouped_aggregation(entities: dict, request=None) -> list:
        """Handle GROUP BY aggregation queries (DBMS concept: GROUP BY with aggregation)"""
        from django.db.models import Count, Sum, Avg
        
        group_by = entities.get('group_by', 'artist')
        aggregation_type = entities.get('aggregation_type', 'count')
        
        if group_by == 'artist':
            # Group by artist
            if aggregation_type == 'count':
                artists = User.objects.filter(role='artist').annotate(
                    song_count=Count('songs', filter=Q(songs__approved=True))
                ).order_by('-song_count')[:20]
                
                results = []
                for artist in artists:
                    pic_url = None
                    if artist.profile_picture and request:
                        try:
                            pic_url = request.build_absolute_uri(artist.profile_picture.url)
                        except:
                            pic_url = artist.profile_picture.url
                    elif artist.profile_picture:
                        pic_url = artist.profile_picture.url
                    
                    results.append({
                        'artist_name': artist.stage_name or artist.username,
                        'artist_id': artist.id,
                        'count': artist.song_count,
                        'profile_picture': pic_url,
                        'label': f"{artist.song_count} songs"
                    })
                return results
        
        elif group_by == 'genre':
            # Group by genre
            if aggregation_type == 'count':
                genres = Genre.objects.annotate(
                    song_count=Count('song', filter=Q(song__approved=True))
                ).order_by('-song_count')[:20]
                
                results = []
                for genre in genres:
                    results.append({
                        'genre_name': genre.name,
                        'genre_id': genre.id,
                        'count': genre.song_count,
                        'label': f"{genre.song_count} songs",
                        'description': genre.description or ''
                    })
                return results
        
        elif group_by == 'album':
            # Group by album
            if aggregation_type == 'count':
                albums = Album.objects.annotate(
                    song_count=Count('songs', filter=Q(songs__approved=True))
                ).order_by('-song_count')[:20]
                
                results = []
                for album in albums:
                    cover_url = None
                    if album.cover_image and request:
                        try:
                            cover_url = request.build_absolute_uri(album.cover_image.url)
                        except:
                            cover_url = album.cover_image.url
                    elif album.cover_image:
                        cover_url = album.cover_image.url
                    
                    results.append({
                        'album_title': album.title,
                        'album_id': album.id,
                        'artist_name': album.artist.stage_name or album.artist.username,
                        'count': album.song_count,
                        'cover_image': cover_url,
                        'label': f"{album.song_count} songs"
                    })
                return results
        
        return []
    
    @staticmethod
    def _get_user_favorites(entities: dict, user, request=None) -> list:
        """Get user's favorite songs, artists, or albums"""
        favorite_type = entities.get('favorite_type', 'songs')
        
        if favorite_type == 'songs':
            # Get user's favorite songs
            favorites = user.favorites.filter(content_type__model='song').select_related('content_object__artist', 'content_object__album')
            results = []
            for favorite in favorites:
                song = favorite.content_object
                if song and song.approved:
                    cover_url = None
                    if song.cover_image and request:
                        try:
                            cover_url = request.build_absolute_uri(song.cover_image.url)
                        except:
                            cover_url = song.cover_image.url
                    elif song.cover_image:
                        cover_url = song.cover_image.url
                    elif song.album and song.album.cover_image:
                        try:
                            cover_url = request.build_absolute_uri(song.album.cover_image.url) if request else song.album.cover_image.url
                        except:
                            cover_url = song.album.cover_image.url
                    
                    audio_url = None
                    try:
                        audio_url = request.build_absolute_uri(f"/api/songs/stream/{song.id}/") if request else f"/api/songs/stream/{song.id}/"
                    except Exception:
                        audio_url = f"/api/songs/stream/{song.id}/"
                    
                    results.append({
                        'id': song.id,
                        'title': song.title,
                        'artist_name': song.artist.stage_name or song.artist.username,
                        'artist_id': song.artist.id,
                        'album': song.album.title if song.album else None,
                        'album_id': song.album.id if song.album else None,
                        'genre': song.genre.name if song.genre else None,
                        'cover_image': cover_url,
                        'audio_url': audio_url,
                        'play_count': song.play_count,
                        'duration': song.duration,
                        'favorited_at': favorite.created_at.isoformat(),
                        'is_favorite': True
                    })
            return results
        
        elif favorite_type == 'artists':
            # Get user's favorite artists
            favorites = user.favorites.filter(content_type__model='user').select_related('content_object')
            results = []
            for favorite in favorites:
                artist = favorite.content_object
                if artist and artist.role == 'artist':
                    pic_url = None
                    if artist.profile_picture and request:
                        try:
                            pic_url = request.build_absolute_uri(artist.profile_picture.url)
                        except:
                            pic_url = artist.profile_picture.url
                    elif artist.profile_picture:
                        pic_url = artist.profile_picture.url
                    
                    results.append({
                        'id': artist.id,
                        'username': artist.username,
                        'stage_name': artist.stage_name or artist.username,
                        'profile_picture': pic_url,
                        'bio': artist.bio,
                        'songs_count': artist.songs.filter(approved=True).count(),
                        'albums_count': artist.albums.count(),
                        'favorited_at': favorite.created_at.isoformat(),
                        'is_favorite': True
                    })
            return results
        
        elif favorite_type == 'albums':
            # Get user's favorite albums
            favorites = user.favorites.filter(content_type__model='album').select_related('content_object__artist')
            results = []
            for favorite in favorites:
                album = favorite.content_object
                if album:
                    cover_url = None
                    if album.cover_image and request:
                        try:
                            cover_url = request.build_absolute_uri(album.cover_image.url)
                        except:
                            cover_url = album.cover_image.url
                    elif album.cover_image:
                        cover_url = album.cover_image.url
                    
                    results.append({
                        'id': album.id,
                        'title': album.title,
                        'artist_name': album.artist.stage_name or album.artist.username,
                        'artist_id': album.artist.id,
                        'cover_image': cover_url,
                        'release_date': album.release_date.isoformat() if album.release_date else None,
                        'songs_count': album.songs.filter(approved=True).count(),
                        'favorited_at': favorite.created_at.isoformat(),
                        'is_favorite': True
                    })
            return results
        
        return []
    
    @staticmethod
    def _get_user_history(entities: dict, user, request=None) -> list:
        """Get user's listening history"""
        from django.utils import timezone
        from datetime import timedelta
        
        queryset = user.listening_history.all().select_related('song__artist', 'song__album').order_by('-played_at')
        
        # Apply time range filter
        time_range = entities.get('time_range')
        if time_range:
            now = timezone.now()
            if time_range == 'today':
                start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(played_at__gte=start_time)
            elif time_range == 'this_week':
                start_time = now - timedelta(days=7)
                queryset = queryset.filter(played_at__gte=start_time)
            elif time_range == 'this_month':
                start_time = now - timedelta(days=30)
                queryset = queryset.filter(played_at__gte=start_time)
            elif time_range == 'recent':
                queryset = queryset[:50]  # Last 50 plays
        
        history_entries = queryset[:100]  # Limit to 100 entries
        
        results = []
        for entry in history_entries:
            song = entry.song
            if song and song.approved:
                cover_url = None
                if song.cover_image and request:
                    try:
                        cover_url = request.build_absolute_uri(song.cover_image.url)
                    except:
                        cover_url = song.cover_image.url
                elif song.cover_image:
                    cover_url = song.cover_image.url
                elif song.album and song.album.cover_image:
                    try:
                        cover_url = request.build_absolute_uri(song.album.cover_image.url) if request else song.album.cover_image.url
                    except:
                        cover_url = song.album.cover_image.url
                
                audio_url = None
                try:
                    audio_url = request.build_absolute_uri(f"/api/songs/stream/{song.id}/") if request else f"/api/songs/stream/{song.id}/"
                except Exception:
                    audio_url = f"/api/songs/stream/{song.id}/"
                
                results.append({
                    'id': song.id,
                    'title': song.title,
                    'artist_name': song.artist.stage_name or song.artist.username,
                    'artist_id': song.artist.id,
                    'album': song.album.title if song.album else None,
                    'album_id': song.album.id if song.album else None,
                    'genre': song.genre.name if song.genre else None,
                    'cover_image': cover_url,
                    'audio_url': audio_url,
                    'play_count': song.play_count,
                    'duration': song.duration,
                    'played_at': entry.played_at.isoformat(),
                    'listening_time': entry.listening_time
                })
        
        return results
    
    @staticmethod
    def _get_user_stats_detailed(entities: dict, user, request=None) -> dict:
        """Get detailed user statistics"""
        stat_type = entities.get('stat_type', 'most_played')
        
        if stat_type == 'most_played':
            # Get user's most played songs
            from django.db.models import Count
            
            # Get songs from listening history, ordered by frequency
            most_played = user.listening_history.values('song').annotate(
                play_count=Count('song')
            ).order_by('-play_count')[:10]
            
            results = []
            for item in most_played:
                try:
                    from songs.models import Song
                    song = Song.objects.select_related('artist', 'album').get(id=item['song'])
                    if song.approved:
                        cover_url = None
                        if song.cover_image and request:
                            try:
                                cover_url = request.build_absolute_uri(song.cover_image.url)
                            except:
                                cover_url = song.cover_image.url
                        elif song.cover_image:
                            cover_url = song.cover_image.url
                        elif song.album and song.album.cover_image:
                            try:
                                cover_url = request.build_absolute_uri(song.album.cover_image.url) if request else song.album.cover_image.url
                            except:
                                cover_url = song.album.cover_image.url
                        
                        audio_url = None
                        try:
                            audio_url = request.build_absolute_uri(f"/api/songs/stream/{song.id}/") if request else f"/api/songs/stream/{song.id}/"
                        except Exception:
                            audio_url = f"/api/songs/stream/{song.id}/"
                        
                        results.append({
                            'id': song.id,
                            'title': song.title,
                            'artist_name': song.artist.stage_name or song.artist.username,
                            'artist_id': song.artist.id,
                            'album': song.album.title if song.album else None,
                            'album_id': song.album.id if song.album else None,
                            'genre': song.genre.name if song.genre else None,
                            'cover_image': cover_url,
                            'audio_url': audio_url,
                            'user_play_count': item['play_count'],
                            'duration': song.duration
                        })
                except:
                    continue
            
            return {
                'stat_type': 'most_played',
                'results': results,
                'description': f'Your top {len(results)} most played songs'
            }
        
        return {
            'stat_type': stat_type,
            'results': [],
            'description': 'No statistics available'
        }