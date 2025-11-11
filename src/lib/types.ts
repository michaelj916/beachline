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
        };
        Update: {
          buoy_id?: string;
          name?: string;
          lat?: number | null;
          lng?: number | null;
          is_public?: boolean;
        };
      };
    };
  };
};


