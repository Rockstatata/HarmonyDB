import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/home/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="bg-dark/80 backdrop-blur-sm border-b border-accent/30 p-4">
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-full border-none outline-none focus:bg-gray-700 transition-colors"
            />
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;