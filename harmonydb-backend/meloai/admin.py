from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import *  # Import all models from meloai if any exist

# If you have any MeloAI specific models, register them here
# For example:
# @admin.register(YourMeloAIModel)
# class YourMeloAIModelAdmin(admin.ModelAdmin):
#     list_display = ('field1', 'field2', 'created_at')
#     list_filter = ('created_at',)
#     search_fields = ('field1', 'field2')

# This file is ready for future MeloAI models
