# MeloAI Assistant Implementation

## Overview
The MeloAI Assistant is a natural language interface for querying your music database using Groq API. It allows users to search for songs, albums, and artists using conversational language.

## Features

### 🎵 Natural Language Queries
- "Find songs by The Weeknd"
- "Show me popular rock songs"
- "Recommend new music for me"
- "What are my music stats?"
- "Find jazz albums from 2020"

### 🎯 Smart Intent Detection
- **Search Songs**: Find specific songs by title, artist, genre, or other criteria
- **Search Albums**: Discover albums by name, artist, or release year
- **Search Artists**: Find artists by name and see their statistics
- **Get Stats**: View personalized music statistics
- **Recommendations**: Get AI-powered music recommendations

### 🧠 AI-Powered Features
- Natural language understanding via Groq API
- Context-aware responses
- Fallback processing when API is unavailable
- Smart entity extraction from user queries

## API Endpoints

### POST `/api/ai/query/`
Process natural language queries and return structured results.

**Request:**
```json
{
  "query": "Find songs by The Weeknd"
}
```

**Response:**
```json
{
  "prompt_id": 123,
  "query": "Find songs by The Weeknd",
  "intent": "search_songs",
  "entities": {
    "artist_name": "The Weeknd"
  },
  "ai_response": "I found several songs by The Weeknd",
  "result_type": "songs",
  "results": [...],
  "count": 5,
  "sql_query": "SELECT * FROM songs_song WHERE artist__username ICONTAINS 'The Weeknd'",
  "success": true
}
```

### GET `/api/ai/recommendations/`
Get personalized music recommendations based on user's listening history and favorites.

**Response:**
```json
{
  "recommendations": [...],
  "count": 10,
  "recommendation_reason": "Based on your rock music preferences",
  "success": true
}
```

### GET `/api/ai/insights/`
Get user's music statistics and insights.

**Response:**
```json
{
  "insights": {
    "songs_created": 15,
    "albums_created": 3,
    "total_plays": 1250
  },
  "summary": "You're an active artist with great engagement!",
  "success": true
}
```

## Frontend Integration

### Enhanced AIQuery Component
The AI assistant is accessible through the `/home/ai` route and provides:

- **Smart Query Interface**: Natural language input with suggestions
- **Dynamic Results**: Results displayed using existing MediaCard components
- **Recommendations**: Personalized song recommendations
- **Insights**: User statistics and analytics
- **Conversation History**: Previous queries and responses

### Component Features
- Real-time query processing
- Visual feedback for different result types (songs, albums, artists, stats)
- Integration with existing player context for song playback
- Responsive design matching the existing UI

## Configuration

### Environment Variables
Add to your `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

### Backend Setup
1. The `meloai` app is added to `INSTALLED_APPS`
2. AI endpoints are included in main URL configuration
3. Groq service handles API communication
4. Query processor manages database interactions

### Frontend Setup
1. New AI endpoints added to `apiServices.ts`
2. Enhanced `AIQuery` component with full functionality
3. Proper TypeScript interfaces for AI responses
4. Integration with existing components and contexts

## Usage Examples

### Basic Queries
```
"Show me songs by artist X"
"Find albums from 2020"
"What rock songs do you have?"
"How many songs have I created?"
```

### Advanced Queries
```
"Recommend songs similar to my favorites"
"Find popular songs with high play counts"
"Show me albums in the jazz genre"
"What are my music statistics?"
```

## Error Handling

### API Failures
- Fallback to keyword-based processing when Groq API is unavailable
- User-friendly error messages
- Graceful degradation of functionality

### Query Processing
- Smart entity extraction from natural language
- Flexible SQL query generation
- Validation of database results

## Performance Considerations

### Caching
- Query results can be cached for common searches
- AI responses stored in database for conversation history

### Rate Limiting
- Groq API calls are managed to stay within limits
- Fallback processing reduces API dependency

### Database Optimization
- Efficient queries with proper indexing
- Limited result sets to prevent performance issues

## Security

### Authentication
- All AI endpoints require user authentication
- User-specific data isolation

### Input Validation
- SQL injection prevention through parameterized queries
- Input sanitization for AI processing

### Privacy
- User queries and responses stored securely
- No sensitive data sent to external APIs

## Future Enhancements

### Planned Features
- Voice input support
- More sophisticated recommendation algorithms
- Multi-language support
- Advanced analytics and insights

### Scalability
- Microservice architecture for AI processing
- Distributed caching for better performance
- Load balancing for high-traffic scenarios

## Development Notes

### Code Structure
```
harmonydb-backend/
├── meloai/
│   ├── services.py      # Groq API integration and query processing
│   ├── views.py         # API endpoints
│   └── urls.py          # URL routing
└── songs/
    └── models.py        # AI-related models (AIPrompt, AIInteraction)

harmonydb-frontend/
├── src/
│   ├── components/Home/
│   │   └── AIQuery.tsx  # Enhanced AI interface
│   ├── services/
│   │   └── apiServices.ts # AI endpoint integration
│   └── types/
│       └── index.ts     # AI response types
```

### Key Classes
- `GroqAIService`: Handles Groq API communication
- `MusicQueryProcessor`: Processes AI responses and executes database queries
- `AIQueryView`: Main API endpoint for query processing

## Testing

### Manual Testing
1. Navigate to `/home/ai` in the frontend
2. Try various natural language queries
3. Verify results are displayed correctly
4. Test recommendations and insights features

### API Testing
```bash
# Test query endpoint
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "find songs by The Weeknd"}'

# Test recommendations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/ai/recommendations/

# Test insights
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/ai/insights/
```

## Troubleshooting

### Common Issues
1. **404 on AI endpoints**: Ensure `meloai` is in `INSTALLED_APPS` and URLs are configured
2. **Groq API errors**: Check API key configuration and network connectivity
3. **Empty results**: Verify database has music data and user has appropriate permissions
4. **Frontend errors**: Check API service integration and component imports

### Debug Tips
- Enable Django debug mode for detailed error messages
- Check browser console for frontend errors
- Verify authentication tokens are valid
- Test with simple queries first

## Support
For issues or questions about the AI assistant implementation, check:
1. Error logs in Django admin
2. Browser console for frontend issues
3. Network tab for API communication problems
4. Database for data availability