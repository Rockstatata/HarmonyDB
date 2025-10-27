import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Home/Sidebar';
import PlayerBar from '../../components/Home/PlayerBar';
import Header from '../../components/Home/Header';
import Dashboard from '../../components/Home/Dashboard';
import MyMusic from '../../components/Home/MyMusic';
import Library from '../../components/Home/Library';
import PlaylistDetail from '../../components/Home/PlaylistDetail';
import Favorites from '../../components/Home/Favorites';
import History from '../../components/Home/History';
import AIQuery from '../../components/Home/AIQuery';
import Profile from '../../components/Home/Profile';
import Search from '../../components/Home/Search';
import AlbumDetail from '../../components/Home/AlbumDetail';
import Artists from '../../components/Home/Artists';
import ArtistDetail from '../../components/Home/ArtistDetail';
import { useAuth } from '../../context/authContext';

const Home = () => {
  const { user } = useAuth();

  // Component to protect artist-only routes
  const ArtistRoute = ({ children }: { children: React.ReactNode }) => {
    if (user?.role !== 'artist') {
      return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="bg-dark min-h-screen flex flex-col">
      {/* Header with Search */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full z-10">
          <Sidebar />
        </div>
        
        {/* Content Area with left margin for sidebar */}
        <main className="flex-1 ml-64 bg-gradient-to-br from-dark via-accent to-secondary overflow-y-auto pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artist/:id" element={<ArtistDetail />} />
            <Route path="/my-music" element={
              <ArtistRoute>
                <MyMusic />
              </ArtistRoute>
            } />
            <Route path="/album/:id" element={
              <ArtistRoute>
                <AlbumDetail />
              </ArtistRoute>
            } />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<History />} />
            <Route path="/ai" element={<AIQuery />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
      
      {/* Fixed Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <PlayerBar />
      </div>
    </div>
  );
};

export default Home;