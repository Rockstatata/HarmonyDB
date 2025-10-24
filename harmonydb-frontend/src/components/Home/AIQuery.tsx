import { useState, useEffect } from 'react';
import { Brain, Send, Trash2 } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import type { AIPrompt } from '../../types';

const AIQuery = () => {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const userPrompts = await apiService.getAIPrompts();
        setPrompts(userPrompts);
      } catch (error) {
        console.error('Error fetching AI prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, []);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || loading) return;

    setLoading(true);
    try {
      const prompt = await apiService.createAIPrompt(newPrompt);
      setPrompts([prompt, ...prompts]);
      setNewPrompt('');
    } catch (error) {
      console.error('Error creating AI prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPrompts) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading AI conversations...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <Brain className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
          <p className="text-gray-400">Ask questions about your music and get insights</p>
        </div>
      </div>

      {/* Prompt Input */}
      <form onSubmit={handleSubmitPrompt} className="mb-8">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Ask me anything about your music..."
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border-none outline-none focus:bg-gray-700 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newPrompt.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center space-x-2"
          >
            <Send size={20} />
            <span>{loading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </form>

      {/* Conversation History */}
      <div className="space-y-6">
        {prompts.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="mx-auto text-gray-600 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
            <p className="text-gray-400">Start a conversation with the AI assistant</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <div key={prompt.id} className="bg-gray-900/40 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">You</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(prompt.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-gray-200 mb-4">{prompt.prompt_text}</p>
              
              {prompt.response_text && (
                <div className="border-l-4 border-purple-600 pl-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Brain size={16} className="text-white" />
                    </div>
                    <p className="text-white font-medium">AI Assistant</p>
                  </div>
                  <p className="text-gray-200">{prompt.response_text}</p>
                </div>
              )}
              
              {!prompt.response_text && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <p className="text-gray-400 italic">Thinking...</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIQuery;