import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}));

interface Story {
  id: string;
  title: string;
  content: string;
  genre: string;
  contentRating: string;
  status: string;
  nsfwScore?: number;
}

interface StoryStore {
  currentStory: Story | null;
  stories: Story[];
  setCurrentStory: (story: Story) => void;
  addStory: (story: Story) => void;
  updateStory: (story: Story) => void;
}

export const useStoryStore = create<StoryStore>((set) => ({
  currentStory: null,
  stories: [],
  setCurrentStory: (story) => set({ currentStory: story }),
  addStory: (story) => set((state) => ({ stories: [...state.stories, story] })),
  updateStory: (story) => set((state) => ({
    stories: state.stories.map((s) => (s.id === story.id ? story : s)),
  })),
}));
