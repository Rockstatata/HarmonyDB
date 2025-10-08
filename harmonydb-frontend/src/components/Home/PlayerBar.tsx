import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function PlayerBar() {
  // Mock player state - integrate with usePlayer hook later
  const isPlaying = false;
  const currentSong = { title: "Song Title", artist: "Artist Name", cover: "/song-cover.jpg" };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-accent flex items-center justify-between p-4 text-gray-200 glass border-t border-white/20">
      <div className="flex items-center space-x-3 w-1/4">
        <img src={currentSong.cover} alt="cover" className="w-12 h-12 rounded" />
        <div>
          <h4 className="font-semibold text-sm">{currentSong.title}</h4>
          <p className="text-xs text-gray-400">{currentSong.artist}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="hover:text-primary"><SkipBack /></button>
        <button className="hover:text-primary text-xl">{isPlaying ? <Pause /> : <Play />}</button>
        <button className="hover:text-primary"><SkipForward /></button>
      </div>
      <div className="w-1/4 flex items-center space-x-2">
        <span className="text-xs">0:00</span>
        <div className="flex-1 bg-gray-700 h-1 rounded-full">
          <div className="bg-primary h-1 rounded-full w-1/4"></div>
        </div>
        <span className="text-xs">3:45</span>
      </div>
    </div>
  );
}