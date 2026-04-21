import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface VideoPost {
  id: string;
  videoUrl: string;
  description: string;
  hashtags: string[];
  platforms: string[];
  timestamp: string;
  scheduledTime?: string;
  status: "sent" | "failed" | "pending" | "scheduled" | "processing";
  jobId?: string;
  thumbnail?: string;
  title?: string;
}

interface AppContextType {
  posts: VideoPost[];
  addPost: (post: VideoPost) => Promise<void>;
  updatePost: (id: string, patch: Partial<VideoPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  loaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = "nexbot_video_posts";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((s) => {
        if (s) {
          try {
            setPosts(JSON.parse(s));
          } catch {
            // ignore
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (list: VideoPost[]) => {
    setPosts(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addPost = useCallback(
    async (post: VideoPost) => {
      const updated = [post, ...posts];
      await persist(updated);
    },
    [posts, persist],
  );

  const updatePost = useCallback(
    async (id: string, patch: Partial<VideoPost>) => {
      const updated = posts.map((p) => (p.id === id ? { ...p, ...patch } : p));
      await persist(updated);
    },
    [posts, persist],
  );

  const deletePost = useCallback(
    async (id: string) => {
      const updated = posts.filter((p) => p.id !== id);
      await persist(updated);
    },
    [posts, persist],
  );

  return (
    <AppContext.Provider value={{ posts, addPost, updatePost, deletePost, loaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
