from django.urls import path
from .views import AIQueryView, AIRecommendationsView, AIInsightsView

urlpatterns = [
    path("query/", AIQueryView.as_view(), name="ai-query"),
    path("recommendations/", AIRecommendationsView.as_view(), name="ai-recommendations"),
    path("insights/", AIInsightsView.as_view(), name="ai-insights"),
]