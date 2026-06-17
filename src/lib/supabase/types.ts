export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: "free" | "premium";
          role: "reader" | "editor" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "premium";
          role?: "reader" | "editor" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "premium";
          role?: "reader" | "editor" | "admin";
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          key: string;
          label: string;
          color: string;
          emoji: string;
          slug: string;
        };
        Insert: {
          key: string;
          label: string;
          color: string;
          emoji: string;
          slug: string;
        };
        Update: {
          label?: string;
          color?: string;
          emoji?: string;
          slug?: string;
        };
      };
      authors: {
        Row: {
          id: string;
          name: string;
          bio: string | null;
          avatar_url: string | null;
          email: string | null;
          twitter_handle: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bio?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          twitter_handle?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          twitter_handle?: string | null;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          excerpt: string | null;
          content: string | null;
          cover_url: string | null;
          category_id: number | null;
          author_id: string | null;
          status: "draft" | "published" | "archived";
          is_premium: boolean;
          is_exclusive: boolean;
          reading_time: number | null;
          view_count: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category_id?: number | null;
          author_id?: string | null;
          status?: "draft" | "published" | "archived";
          is_premium?: boolean;
          is_exclusive?: boolean;
          reading_time?: number | null;
          view_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category_id?: number | null;
          author_id?: string | null;
          status?: "draft" | "published" | "archived";
          is_premium?: boolean;
          is_exclusive?: boolean;
          reading_time?: number | null;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      article_views: {
        Row: {
          id: number;
          article_id: string;
          user_id: string | null;
          session_id: string | null;
          ip_hash: string | null;
          viewed_at: string;
        };
        Insert: {
          article_id: string;
          user_id?: string | null;
          session_id?: string | null;
          ip_hash?: string | null;
          viewed_at?: string;
        };
        Update: never;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: "active" | "unsubscribed";
          source: "footer" | "sidebar" | "popup" | "cadastro" | "outro" | null;
          subscribed_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: "active" | "unsubscribed";
          source?: "footer" | "sidebar" | "popup" | "cadastro" | "outro" | null;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          name?: string | null;
          status?: "active" | "unsubscribed";
          unsubscribed_at?: string | null;
        };
      };
      circulares_susep: {
        Row: {
          id: number;
          code: string;
          title: string;
          summary: string | null;
          published_at: string;
          url: string | null;
          is_new: boolean;
          category_key: string | null;
          created_at: string;
        };
        Insert: {
          code: string;
          title: string;
          summary?: string | null;
          published_at: string;
          url?: string | null;
          is_new?: boolean;
          category_key?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          summary?: string | null;
          url?: string | null;
          is_new?: boolean;
          category_key?: string | null;
        };
      };
      market_data: {
        Row: {
          id: number;
          metric: string;
          label: string;
          value: string;
          trend: "positive" | "negative" | "neutral";
          updated_at: string;
        };
        Insert: {
          metric: string;
          label: string;
          value: string;
          trend?: "positive" | "negative" | "neutral";
          updated_at?: string;
        };
        Update: {
          label?: string;
          value?: string;
          trend?: "positive" | "negative" | "neutral";
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "monthly" | "annual";
          status: "active" | "cancelled" | "past_due" | "trialing";
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_end: string | null;
          created_at: string;
          cancelled_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: "monthly" | "annual";
          status?: "active" | "cancelled" | "past_due" | "trialing";
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
          updated_at?: string;
        };
        Update: {
          plan?: "monthly" | "annual";
          status?: "active" | "cancelled" | "past_due" | "trialing";
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancelled_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      increment_article_views: {
        Args: { p_article_id: string };
        Returns: void;
      };
    };
  };
}

// ── Tipos auxiliares ────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Author = Database["public"]["Tables"]["authors"]["Row"];
export type NewsletterSubscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
export type CircularSusep = Database["public"]["Tables"]["circulares_susep"]["Row"];
export type MarketDataRow = Database["public"]["Tables"]["market_data"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

// Artigo com joins
export type ArticleWithRelations = Article & {
  categories: Category | null;
  authors: Author | null;
};
