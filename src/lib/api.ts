const API_BASE_URL = 'https://nonlaminated-subliminally-latanya.ngrok-free.dev/api';

// Helper to add ngrok headers
const getHeaders = (isFormData = false): HeadersInit => {
  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Types
export interface Driver {
  id: number;
  name: string;
}

export interface DriverDetail {
  id: number;
  name: string;
  total_races: number;
  total_laps: number;
}

export interface DriverEvolution {
  driver_id: number;
  driver_name: string;
  evolution: {
    date: string;
    circuit_id: number;
    fastest_lap: string;
    average_lap: string;
  }[];
}

export interface DriverComparison {
  id: number;
  name: string;
  total_races: number;
  total_laps: number;
  best_lap: string;
  average_lap: string;
}

export interface Circuit {
  id: number;
  name: string;
  city: string;
  type: 'indoor' | 'outdoor';
}

export interface CircuitDetail extends Circuit {
  stats: {
    total_races: number;
    total_laps: number;
    fastest_lap_ever: string;
    fastest_lap_driver?: string;
  };
}

export interface CircuitEvolution {
  circuit_id: number;
  circuit_name: string;
  fastest_lap_evolution: {
    date: string;
    race_id: number;
    lap_time: string;
  }[];
  average_lap_evolution: {
    date: string;
    race_id: number;
    lap_time: string;
  }[];
}

export interface Race {
  id: number;
  date: string;
  circuit?: number;
  circuit_name?: string;
}

export interface Lap {
  lap_number: number;
  lap_time: string;
}

export interface RaceResult {
  driver_name: string;
  total_time: string;
  fastest_lap: string;
  average_lap: string;
  laps: Lap[];
}

export interface RaceDetail {
  id: number;
  circuit: number;
  circuit_name?: string;
  date: string;
  results: RaceResult[];
}

export interface LeaderboardEntry {
  driver_id: number;
  driver_name: string;
  fastest_lap?: string;
  average_lap?: string;
}

export interface Leaderboard {
  overall: {
    best_average_lap: LeaderboardEntry[];
    fastest_lap: LeaderboardEntry[];
  };
  last_year: {
    best_average_lap: LeaderboardEntry[];
    fastest_lap: LeaderboardEntry[];
  };
}

export interface OCRDriver {
  name: string;
  laps: Lap[];
  fastest_lap: string;
  average_lap: string;
}

export interface OCRResponse {
  drivers: OCRDriver[];
}

// API Functions
export const api = {
  // Drivers
  getDrivers: async (): Promise<Driver[]> => {
    const response = await fetch(`${API_BASE_URL}/drivers/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch drivers');
    return response.json();
  },

  getDriver: async (id: number): Promise<DriverDetail> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch driver');
    return response.json();
  },

  getDriverEvolution: async (id: number, circuitId?: number): Promise<DriverEvolution> => {
    const url = circuitId
      ? `${API_BASE_URL}/drivers/${id}/evolution/?circuit=${circuitId}`
      : `${API_BASE_URL}/drivers/${id}/evolution/`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch driver evolution');
    return response.json();
  },

  compareDrivers: async (ids: number[], circuitId?: number): Promise<{ drivers: DriverComparison[] }> => {
    const url = circuitId
      ? `${API_BASE_URL}/drivers/compare/?ids=${ids.join(',')}&circuit=${circuitId}`
      : `${API_BASE_URL}/drivers/compare/?ids=${ids.join(',')}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to compare drivers');
    return response.json();
  },

  // Circuits
  getCircuits: async (): Promise<Circuit[]> => {
    const response = await fetch(`${API_BASE_URL}/circuits/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch circuits');
    return response.json();
  },

  getCircuit: async (id: number): Promise<CircuitDetail> => {
    const response = await fetch(`${API_BASE_URL}/circuits/${id}/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch circuit');
    return response.json();
  },

  getCircuitEvolution: async (id: number): Promise<CircuitEvolution> => {
    const response = await fetch(`${API_BASE_URL}/circuits/${id}/evolution/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch circuit evolution');
    return response.json();
  },

  // Races
  getRaces: async (circuitId?: number): Promise<Race[]> => {
    const url = circuitId 
      ? `${API_BASE_URL}/races/?circuit=${circuitId}` 
      : `${API_BASE_URL}/races/`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch races');
    return response.json();
  },

  getRace: async (id: number): Promise<RaceDetail> => {
    const response = await fetch(`${API_BASE_URL}/races/${id}/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch race');
    return response.json();
  },

  getLeaderboard: async (circuitId?: number): Promise<Leaderboard> => {
    const url = circuitId
      ? `${API_BASE_URL}/races/leaderboard/?circuit=${circuitId}`
      : `${API_BASE_URL}/races/leaderboard/`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },

  uploadImage: async (file: File): Promise<OCRResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log('Uploading image to:', `${API_BASE_URL}/races/upload-image/`);
    console.log('File:', file.name, file.type, file.size);
    
    try {
      const response = await fetch(`${API_BASE_URL}/races/upload-image/`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Failed to process image: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  saveRaceResults: async (data: {
    circuit_id: number;
    date: string;
    selected_drivers: OCRDriver[];
  }): Promise<RaceDetail> => {
    const response = await fetch(`${API_BASE_URL}/races/save-results/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save race results');
    return response.json();
  },
};
