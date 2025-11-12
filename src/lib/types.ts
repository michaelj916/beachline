export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export type Spot = {
  id: string;
  user_id: string | null;
  buoy_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  is_public: boolean;
  created_at: string;
  provider_overrides: SpotProviderOverrides | null;
};

export type NdbcRawObservation = Record<string, string | undefined>;

export type NdbcObservation = {
  timestamp: string;
  waveHeight: number | null;
  dominantPeriod: number | null;
  averagePeriod: number | null;
  meanWaveDirection: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  airTemperature: number | null;
  waterTemperature: number | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile & { updated_at?: string | null };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      spots: {
        Row: Spot;
        Insert: {
          id?: string;
          user_id?: string | null;
          buoy_id: string;
          name: string;
          lat?: number | null;
          lng?: number | null;
          is_public?: boolean;
          provider_overrides?: SpotProviderOverrides | null;
        };
        Update: {
          buoy_id?: string;
          name?: string;
          lat?: number | null;
          lng?: number | null;
          is_public?: boolean;
          provider_overrides?: SpotProviderOverrides | null;
        };
        Relationships: [];
      };
      user_saved_spots: {
        Row: {
          id: string;
          user_id: string;
          spot_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          spot_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          spot_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SpotInsert = Database["public"]["Tables"]["spots"]["Insert"];

export type SpotProviderOverrides = {
  cdip?: {
    stationId: string;
  };
  eccc?: {
    stationId: string;
  };
  bom?: {
    stationId: string;
  };
};


