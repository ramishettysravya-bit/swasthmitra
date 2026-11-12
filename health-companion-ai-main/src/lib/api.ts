// API Utility using Fetch

// Interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  riskScore: number;
  emergencyContact?: string;
  emergencyContactNumber?: string;
}

export interface RiskUpdateResponse {
  success: boolean;
  message: string;
  riskScore: number;
  alertStatus?: string;
}

// API Configuration
// Proxy is set up in vite.config.ts
const API_URL = '/api'; 

/**
 * Updates the user's risk score in the backend.
 * This will trigger an SMS alert if the score is >= 75.
 * 
 * @param userId - The user's ID
 * @param riskScore - The calculated risk score
 * @returns Promise with the API response
 */
export const updateRiskScore = async (userId: string, riskScore: number): Promise<RiskUpdateResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/risk-score`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ riskScore }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update risk score');
    }
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error or server unreachable');
  }
};

/**
 * Helper to get current user ID from local storage
 */
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('userId');
};
