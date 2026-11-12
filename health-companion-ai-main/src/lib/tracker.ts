
export interface HealthEvent {
  id: string;
  date: number; // timestamp
  type: 'describe' | 'symptom_select';
  severity: 'low' | 'medium' | 'high';
  details?: string;
  riskScore?: number;
}

const STORAGE_KEY = 'health_tracker_events';

export const saveHealthEvent = (event: Omit<HealthEvent, 'id' | 'date'>) => {
  const events = getHealthEvents();
  // Use a fallback for UUID if crypto is not available (e.g. non-secure context)
  const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
  const newEvent: HealthEvent = {
    ...event,
    id: id,
    date: Date.now(),
  };
  events.push(newEvent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return newEvent;
};

export const getHealthEvents = (): HealthEvent[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const calculateMonthlyScores = () => {
  const events = getHealthEvents();
  // Fixed to March 2026 as requested
  const monthLabel = "Mar";
  const targetMonthIndex = 2; // March is 0-indexed 2
  const targetYear = 2026;

  let totalScore = 0;
  let eventCount = 0;

  events.forEach(event => {
    const d = new Date(event.date);
    if (d.getMonth() === targetMonthIndex && d.getFullYear() === targetYear) {
      let eventHealthScore = 100;
      
      if (event.riskScore !== undefined) {
        // Risk score is "badness" (higher is worse).
        // Health score is 100 - riskScore.
        // We cap it so it doesn't go below 0 and doesn't exceed 100.
        // Example: Risk 40 -> Health 60. Risk 120 -> Health 0.
        // Also handle negative risk score edge case (Risk -10 -> Health 100 max)
        eventHealthScore = Math.min(100, Math.max(0, 100 - event.riskScore));
      } else {
        // Fallback for events without specific risk score
        switch(event.severity) {
          case 'low': eventHealthScore = 90; break;
          case 'medium': eventHealthScore = 70; break;
          case 'high': eventHealthScore = 50; break;
          default: eventHealthScore = 90;
        }
      }
      
      totalScore += eventHealthScore;
      eventCount++;
    }
  });

  const finalScore = eventCount > 0 ? Math.round(totalScore / eventCount) : 100;

  return [
    { label: monthLabel, score: finalScore }
  ];
};

export const calculateYearlyScores = () => {
    const events = getHealthEvents();
    // Fixed to 2026 as requested
    const targetYear = 2026;

    let totalScore = 0;
    let eventCount = 0;

    events.forEach(event => {
        const d = new Date(event.date);
        if (d.getFullYear() === targetYear) {
            let eventHealthScore = 100;
            
            if (event.riskScore !== undefined) {
               eventHealthScore = Math.min(100, Math.max(0, 100 - event.riskScore));
            } else {
                switch(event.severity) {
                    case 'low': eventHealthScore = 90; break;
                    case 'medium': eventHealthScore = 70; break;
                    case 'high': eventHealthScore = 50; break;
                    default: eventHealthScore = 90;
                }
            }
            totalScore += eventHealthScore;
            eventCount++;
        }
    });

    const finalScore = eventCount > 0 ? Math.round(totalScore / eventCount) : 100;

    return [
        { label: "2026", score: finalScore }
    ];
};
