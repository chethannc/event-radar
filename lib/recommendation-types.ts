export type RecommendationIntent = {
  categories: string[];
  neighborhoods: string[];
  timing: string[];
  budget: string[];
};

export type SuggestedFilters = {
  search: string;
  category: string;
  neighborhood: string;
  datePreset: string;
  budget: string;
};
