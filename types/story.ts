export interface Story {
  id: string;
  content: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    age?: string;
    characters?: string;
    setting?: string;
    moral?: string;
    length?: "short" | "medium" | "long";
  };
} 