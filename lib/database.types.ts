export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, Insert, Update, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; username: string; nickname: string; is_public: boolean; avatar_url: string | null; banner_url: string | null; created_at: string; updated_at: string },
        { id: string; username: string; nickname: string; is_public?: boolean; avatar_url?: string | null; banner_url?: string | null; created_at?: string; updated_at?: string },
        { username?: string; nickname?: string; is_public?: boolean; avatar_url?: string | null; banner_url?: string | null; updated_at?: string }
      >;
      user_preferences: Table<
        { user_id: string; theme_preference: 'system' | 'light' | 'dark'; updated_at: string },
        { user_id: string; theme_preference?: 'system' | 'light' | 'dark'; updated_at?: string },
        { theme_preference?: 'system' | 'light' | 'dark'; updated_at?: string }
      >;
      genres: Table<
        { id: string; external_id: number | null; slug: string; name: string; created_at: string },
        { id?: string; external_id?: number | null; slug: string; name: string; created_at?: string },
        { external_id?: number | null; slug?: string; name?: string }
      >;
      anime: Table<
        { id: string; external_id: number; slug: string; title_ru: string; title_original: string | null; description: string | null; poster_url: string | null; banner_url: string | null; poster_source_url: string | null; banner_source_url: string | null; year: number | null; type: string | null; age_rating: string | null; release_status: string; genres: string[]; episodes_count: number | null; views_count: number; is_published: boolean; search_vector: string; external_updated_at: string | null; created_at: string; updated_at: string },
        { id?: string; external_id: number; slug: string; title_ru: string; title_original?: string | null; description?: string | null; poster_url?: string | null; banner_url?: string | null; poster_source_url?: string | null; banner_source_url?: string | null; year?: number | null; type?: string | null; age_rating?: string | null; release_status?: string; genres?: string[]; episodes_count?: number | null; views_count?: number; is_published?: boolean; external_updated_at?: string | null; created_at?: string; updated_at?: string },
        { slug?: string; title_ru?: string; title_original?: string | null; description?: string | null; poster_url?: string | null; banner_url?: string | null; poster_source_url?: string | null; banner_source_url?: string | null; year?: number | null; type?: string | null; age_rating?: string | null; release_status?: string; genres?: string[]; episodes_count?: number | null; views_count?: number; is_published?: boolean; external_updated_at?: string | null; updated_at?: string }
      >;
      anime_genres: Table<
        { anime_id: string; genre_id: string },
        { anime_id: string; genre_id: string },
        { anime_id?: string; genre_id?: string },
        [
          { foreignKeyName: 'anime_genres_anime_id_fkey'; columns: ['anime_id']; isOneToOne: false; referencedRelation: 'anime'; referencedColumns: ['id'] },
          { foreignKeyName: 'anime_genres_genre_id_fkey'; columns: ['genre_id']; isOneToOne: false; referencedRelation: 'genres'; referencedColumns: ['id'] }
        ]
      >;
      episodes: Table<
        { id: string; external_id: string | null; anime_id: string; episode_number: number; title: string | null; hls_url: string | null; preview_url: string | null; duration_seconds: number | null; created_at: string; updated_at: string },
        { id?: string; external_id?: string | null; anime_id: string; episode_number: number; title?: string | null; hls_url?: string | null; preview_url?: string | null; duration_seconds?: number | null; created_at?: string; updated_at?: string },
        { external_id?: string | null; anime_id?: string; episode_number?: number; title?: string | null; hls_url?: string | null; preview_url?: string | null; duration_seconds?: number | null; updated_at?: string },
        [{ foreignKeyName: 'episodes_anime_id_fkey'; columns: ['anime_id']; isOneToOne: false; referencedRelation: 'anime'; referencedColumns: ['id'] }]
      >;
      user_anime_status: Table<
        { user_id: string; anime_id: string; status: Database['public']['Enums']['anime_status']; updated_at: string },
        { user_id: string; anime_id: string; status: Database['public']['Enums']['anime_status']; updated_at?: string },
        { status?: Database['public']['Enums']['anime_status']; updated_at?: string },
        [{ foreignKeyName: 'user_anime_status_anime_id_fkey'; columns: ['anime_id']; isOneToOne: false; referencedRelation: 'anime'; referencedColumns: ['id'] }]
      >;
      anime_ratings: Table<
        { user_id: string; anime_id: string; rating: number; updated_at: string },
        { user_id: string; anime_id: string; rating: number; updated_at?: string },
        { rating?: number; updated_at?: string },
        [{ foreignKeyName: 'anime_ratings_anime_id_fkey'; columns: ['anime_id']; isOneToOne: false; referencedRelation: 'anime'; referencedColumns: ['id'] }]
      >;
      reviews: Table<
        { id: string; user_id: string; anime_id: string; rating: number; text: string; is_visible: boolean; moderation_note: string | null; created_at: string; updated_at: string },
        { id?: string; user_id: string; anime_id: string; rating: number; text: string; is_visible?: boolean; moderation_note?: string | null; created_at?: string; updated_at?: string },
        { rating?: number; text?: string; is_visible?: boolean; moderation_note?: string | null; updated_at?: string },
        [
          { foreignKeyName: 'reviews_anime_id_fkey'; columns: ['anime_id']; isOneToOne: false; referencedRelation: 'anime'; referencedColumns: ['id'] },
          { foreignKeyName: 'reviews_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      >;
      review_reports: Table<
        { id: string; review_id: string; reporter_id: string; reason: string; created_at: string },
        { id?: string; review_id: string; reporter_id: string; reason: string; created_at?: string },
        { reason?: string },
        [{ foreignKeyName: 'review_reports_review_id_fkey'; columns: ['review_id']; isOneToOne: false; referencedRelation: 'reviews'; referencedColumns: ['id'] }]
      >;
    };
    Views: {
      anime_catalog: {
        Row: { id: string; slug: string; title_ru: string; title_original: string | null; description: string | null; poster_url: string | null; banner_url: string | null; year: number | null; type: string | null; age_rating: string | null; release_status: string; genres: string[]; episodes_count: number | null; views_count: number; created_at: string; updated_at: string; average_rating: number; ratings_count: number; popularity_count: number };
        Relationships: [];
      };
    };
    Functions: {
      search_anime: {
        Args: { p_query?: string | null; p_genre?: string | null; p_year?: number | null; p_type?: string | null; p_age_rating?: string | null; p_status?: string | null; p_sort?: string | null; p_limit?: number | null; p_offset?: number | null };
        Returns: { id: string; slug: string; title_ru: string; title_original: string | null; description: string | null; poster_url: string | null; banner_url: string | null; year: number | null; type: string | null; age_rating: string | null; release_status: string; genres: string[]; episodes_count: number | null; average_rating: number; ratings_count: number; popularity_count: number; views_count: number; created_at: string; total_count: number }[];
      };
      public_profile_stats: { Args: { p_user_id: string }; Returns: { completed: number; planned: number; dropped: number; watching: number; total: number }[] };
      record_anime_view: { Args: { p_anime_id: string }; Returns: undefined };
      moderate_review: { Args: { p_review_id: string; p_visible: boolean; p_note?: string | null }; Returns: undefined };
    };
    Enums: { anime_status: 'watching' | 'planned' | 'completed' | 'dropped' };
    CompositeTypes: { [_ in never]: never };
  };
};
