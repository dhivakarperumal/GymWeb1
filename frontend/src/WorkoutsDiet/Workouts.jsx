import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageContainer from "../Components/PageContainer";
import { FaDumbbell } from "react-icons/fa";
import cache from "../cache";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtube.com/shorts/")) {
    videoId = url.split("shorts/")[1].split("?")[0];
  } else if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

export default function Workouts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openWorkout, setOpenWorkout] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    if (cache.workouts) {
      setWorkouts(cache.workouts);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // Use the user's unique identifier (UUID preferred, then integer ID)
      const identifier = user.user_id || user.id;
      const res = await api.get(`/workouts?memberId=${identifier}`);
      const myWorkouts = Array.isArray(res.data) ? res.data : [];
      setWorkouts(myWorkouts);
      cache.workouts = myWorkouts;
    } catch (err) {
      console.error("Workout fetch error:", err);
      if (!cache.workouts) toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-full flex flex-col">
      <PageContainer className="max-w-none w-full px-4 sm:px-6 lg:px-10 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Assembling Routine</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="flex flex-col items-center mt-20 text-center px-4">
            <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 mb-6">
              <FaDumbbell className="text-red-500 text-4xl" />
            </div>

            <h2 className="text-xl font-bold">No Workouts Assigned</h2>

            <p className="text-gray-400 mt-2 max-w-sm">
              You don't have any workout plans yet. Subscribe to a plan to unlock workouts.
            </p>

            <button
              onClick={() => navigate("/pricing")}
              className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            >
              View Plans
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto md:py-10">
              <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500/20 overflow-hidden">
                <table className="min-w-full border border-zinc-800 table-auto">
                  <thead className="bg-gray-900 text-gray-300 text-sm uppercase border-b border-red-500/20">
                    <tr>
                      <th className="px-6 py-4 text-left">Goal</th>
                      {/* <th className="px-6 py-4 text-left">Duration</th> */}
                      <th className="px-6 py-4 text-left">Level</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {workouts.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                <FaDumbbell className="text-red-500 text-xl" />
                              </div>

                              <div>
                                <h3 className="text-lg font-bold text-white">
                                  {item.goal}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {item.level} Program
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {item.level}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() =>
                                setOpenWorkout(openWorkout === item.id ? null : item.id)
                              }
                              className="bg-red-600 px-4 py-2 rounded-lg"
                            >
                              {openWorkout === item.id ? "Close" : "View"}
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4 py-6">
              {workouts.map((item) => (
                <div key={item.id || item.goal} className="bg-gray-900 rounded-2xl border border-red-500/20 p-4 shadow-xl">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Goal</p>
                        <p className="text-lg font-semibold text-white">{item.goal}</p>
                      </div>
                      <button
                        onClick={() => setOpenWorkout(openWorkout === item.id ? null : item.id)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em]"
                      >
                        {openWorkout === item.id ? 'Close' : 'View'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                      {/* <div className="bg-black/40 rounded-2xl p-3 border border-red-500/20">
                        <p className="text-[10px] uppercase tracking-widest">Duration</p>
                        <p className="mt-1 text-white font-medium">{item.duration_weeks} Weeks</p>
                      </div> */}
                      <div className="bg-black/40 rounded-2xl p-3 border border-red-500/20">
                        <p className="text-[10px] uppercase tracking-widest">Level</p>
                        <p className="mt-1 text-white font-medium">{item.level}</p>
                      </div>
                    </div>

                    {openWorkout === item.id && (
                      <div className="space-y-4 pt-4 border-t border-red-500/10">
                        <div className="grid gap-3">
                          <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Trainer</p>
                          <p className="text-white font-semibold">{item.trainer_name}</p>
                        </div>

                        {Object.entries(item.days || {}).map(([day, exercises], idx) => (
                          <div key={idx} className="bg-gray-800 rounded-2xl p-4 border border-red-500/20">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-semibold text-red-500">{day}</p>
                              <span className="text-xs text-gray-400">{exercises.length} Exercises</span>
                            </div>
                            <div className="space-y-3">
                              {exercises.map((ex, j) => (
                                <div key={j} className="rounded-2xl border border-red-500/10 bg-black/40 p-3">
                                  {ex.media && (
                                    <div
                                      onClick={() => setPlayingVideo({ url: ex.media, name: ex.name })}
                                      className="w-full aspect-video rounded-xl overflow-hidden border border-red-500/20 mb-3 bg-black/60 relative cursor-pointer"
                                    >
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                        </div>
                                      </div>
                                      {ex.media.startsWith('data:video') || ex.media.match(/\.(mp4|webm|ogg)$/i) || ex.media.includes('youtube.com') || ex.media.includes('youtu.be') ? (
                                        ex.media.includes('youtube.com') || ex.media.includes('youtu.be') ? (
                                          <iframe
                                            src={getYouTubeEmbedUrl(ex.media)}
                                            className="w-full h-full border-0 pointer-events-none"
                                            title="Exercise preview"
                                          />
                                        ) : (
                                          <video src={ex.media} className="w-full h-full object-cover" />
                                        )
                                      ) : (
                                        <img src={ex.media} alt={ex.name} className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                  )}
                                  <p className="font-semibold text-white mb-2">{ex.name}</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                    <div>
                                      <p>Time</p>
                                      <p className="text-white">{ex.time || '--'}</p>
                                    </div>
                                    <div>
                                      <p>Sets</p>
                                      <p className="text-white">{ex.sets || '--'}</p>
                                    </div>
                                    <div>
                                      <p>Reps</p>
                                      <p className="text-white">{ex.count || '--'}</p>
                                    </div>
                                    <div>
                                      <p>Type</p>
                                      <p className="text-orange-400">{ex.type || '--'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </PageContainer>

      {/* VIDEO POPUP MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setPlayingVideo(null)}
          ></div>

          <div className="relative w-full max-w-4xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
              <h3 className="text-white font-bold tracking-tight">{playingVideo.name}</h3>
              <button
                onClick={() => setPlayingVideo(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all"
              >
                <span className="text-2xl font-light">&times;</span>
              </button>
            </div>

            {/* Video Content */}
            <div className="aspect-video w-full bg-black">
              {playingVideo.url.includes('youtube.com') || playingVideo.url.includes('youtu.be') ? (
                <iframe
                  src={`${getYouTubeEmbedUrl(playingVideo.url)}?autoplay=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video Player"
                />
              ) : (
                <video
                  src={playingVideo.url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
