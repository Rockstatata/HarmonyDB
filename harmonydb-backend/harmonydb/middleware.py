from django.db import connection, reset_queries
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import json
import time

class SQLDebugMiddleware(MiddlewareMixin):
    """
    Middleware to capture and include SQL queries in API responses
    Only works when DEBUG=True for security
    """
    
    def process_request(self, request):
        # Reset queries to ensure we only capture queries for this request
        reset_queries()
        request._sql_start_time = time.time()
    
    def process_response(self, request, response):
        from django.conf import settings
        
        # Only add SQL debug info if DEBUG is True
        if not settings.DEBUG:
            return response
        
        # Capture queries for ALL requests that touch the database
        # Skip static files and certain paths that don't need monitoring
        skip_paths = ['/static/', '/media/', '/favicon.ico']
        should_skip = any(request.path.startswith(path) for path in skip_paths)
        
        if should_skip:
            return response
        
        # Calculate total request time
        total_time = time.time() - getattr(request, '_sql_start_time', time.time())
        
        # Get all executed queries
        queries = connection.queries
        
        # Format SQL debug information
        sql_debug = {
            'count': len(queries),
            'total_time': f"{total_time:.3f}s",
            'queries': [
                {
                    'sql': query['sql'],
                    'time': query['time'],
                    'formatted_sql': self._format_sql(query['sql'])
                }
                for query in queries
            ]
        }
        
        # Add to ALL responses - both JSON and others
        try:
            # Try to add to JSON responses first
            if (isinstance(response, JsonResponse) or 
                response.get('Content-Type', '').startswith('application/json')):
                
                response_data = json.loads(response.content.decode('utf-8'))
                if isinstance(response_data, dict):
                    response_data['_sql_debug'] = sql_debug
                elif isinstance(response_data, list):
                    # For list responses, wrap in object
                    response_data = {
                        'results': response_data,
                        '_sql_debug': sql_debug
                    }
                
                response.content = json.dumps(response_data).encode('utf-8')
                response['Content-Length'] = str(len(response.content))
            
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            # If JSON modification fails or it's not JSON, use headers
            pass
        
        # ALWAYS add headers as fallback (works for all response types)
        response['X-SQL-Debug-Count'] = str(len(queries))
        response['X-SQL-Debug-Time'] = f"{total_time:.3f}s"
        
        # Add individual query info in headers if not too many
        if len(queries) <= 5:
            for i, query in enumerate(queries):
                response[f'X-SQL-Debug-Query-{i+1}'] = query['sql'][:200] + ('...' if len(query['sql']) > 200 else '')
        
        return response
    
    def _format_sql(self, sql):
        """
        Enhanced SQL formatting for better readability
        Handles all types of SQL queries: SELECT, INSERT, UPDATE, DELETE, etc.
        """
        # Extended keywords to format all SQL operations
        keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
            'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
            'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
            'CREATE', 'TABLE', 'INDEX', 'DROP', 'ALTER', 'ADD', 'COLUMN',
            'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
            'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'WITH', 'AS', 'DISTINCT', 'ALL'
        ]
        
        formatted = sql
        
        # Add line breaks after major keywords
        for keyword in keywords:
            # Handle both uppercase and lowercase
            formatted = formatted.replace(f' {keyword} ', f'\n{keyword} ')
            formatted = formatted.replace(f' {keyword.lower()} ', f'\n{keyword.lower()} ')
        
        # Clean up extra whitespace and return
        lines = [line.strip() for line in formatted.split('\n') if line.strip()]
        return '\n'.join(lines)