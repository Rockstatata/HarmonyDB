from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from songs.models import AIPrompt
from songs.serializers import AIPromptSerializer
from .services import GroqAIService, MusicQueryProcessor
import json


class AIQueryView(APIView):
    """Enhanced AI Query endpoint that processes natural language and returns structured results"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user_query = request.data.get('query', '').strip()
        
        if not user_query:
            return Response(
                {"error": "Query is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Initialize AI service
            ai_service = GroqAIService()
            
            # Process the query with AI
            ai_response = ai_service.process_music_query(user_query)
            
            # Execute database query based on AI understanding
            query_results = MusicQueryProcessor.execute_query(ai_response, request.user, request)
            
            # Create and save AI prompt record
            ai_prompt = AIPrompt.objects.create(
                user=request.user,
                prompt_text=user_query,
                response_text=query_results.get('ai_response', ''),
                generated_sql=query_results.get('sql_query', ''),
                executed_result=json.dumps(query_results.get('results', []))
            )
            
            # Return comprehensive response
            return Response({
                'prompt_id': ai_prompt.id,
                'query': user_query,
                'intent': ai_response.get('intent'),
                'entities': ai_response.get('entities'),
                'ai_response': query_results.get('ai_response'),
                'result_type': query_results.get('result_type'),
                'results': query_results.get('results'),
                'count': query_results.get('count'),
                'sql_query': query_results.get('sql_query'),
                'success': query_results.get('success', True)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log error and return user-friendly message
            return Response({
                'error': 'An error occurred while processing your query',
                'details': str(e),
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRecommendationsView(APIView):
    """Get AI-powered music recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get user's listening history and preferences
            user_favorites = request.user.favorites.all()[:10]
            user_history = request.user.listening_history.all()[:20]
            
            if not user_favorites and not user_history:
                # New user - return popular songs
                popular_query = "show me popular songs"
            else:
                # Build recommendation query based on user preferences
                if user_favorites:
                    # Get genres from favorites
                    favorite_items = []
                    for fav in user_favorites:
                        if fav.item_type == 'song':
                            from songs.models import Song
                            try:
                                song = Song.objects.get(id=fav.item_id)
                                if song.genre:
                                    favorite_items.append(song.genre.name)
                            except Song.DoesNotExist:
                                pass
                    
                    if favorite_items:
                        unique_genres = list(set(favorite_items))
                        popular_query = f"recommend songs in {', '.join(unique_genres[:3])} genres"
                    else:
                        popular_query = "recommend popular songs"
                else:
                    popular_query = "recommend trending songs"
            
            # Process recommendation query
            ai_service = GroqAIService()
            ai_response = ai_service.process_music_query(popular_query)
            query_results = MusicQueryProcessor.execute_query(ai_response, request.user, request)
            
            return Response({
                'recommendations': query_results.get('results', []),
                'count': query_results.get('count', 0),
                'recommendation_reason': ai_response.get('natural_response', 'Based on your music preferences'),
                'success': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to generate recommendations',
                'details': str(e),
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIInsightsView(APIView):
    """Get AI-powered insights about user's music"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Process stats query
            ai_service = GroqAIService()
            ai_response = {
                'intent': 'get_stats',
                'entities': {},
                'natural_response': "Here are your music insights"
            }
            
            query_results = MusicQueryProcessor.execute_query(ai_response, request.user, request)
            
            return Response({
                'insights': query_results.get('results', {}),
                'summary': query_results.get('ai_response'),
                'success': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Failed to generate insights',
                'details': str(e),
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
