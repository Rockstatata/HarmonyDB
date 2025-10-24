import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Home/Sidebar';
import PlayerBar from '../../components/Home/PlayerBar';
import Header from '../../components/Home/Header';
import Dashboard from '../../components/Home/Dashboard';
import MyMusic from '../../components/Home/MyMusic';
import Library from '../../components/Home/Library';
import Favorites from '../../components/Home/Favorites';
import History from '../../components/Home/History';
import AIQuery from '../../components/Home/AIQuery';
import Profile from '../../components/Home/Profile';
import Search from '../../components/Home/Search';

const Home = () => {
  return (
    <div className="bg-dark min-h-screen flex flex-col">
      {/* Header with Search */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Content Area */}
        <main className="flex-1 bg-gradient-to-br from-dark via-accent to-secondary overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/my-music" element={<MyMusic />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<History />} />
            <Route path="/ai" element={<AIQuery />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
      
      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
};

export default Home;