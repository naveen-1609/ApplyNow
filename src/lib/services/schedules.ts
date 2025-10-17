export interface Schedule {
  schedule_id: string;
  user_id: string;
  reminder_time: string;
  summary_time: string;
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
}

export interface CreateScheduleData {
  reminder_time: string;
  summary_time: string;
  email_enabled: boolean;
  reminder_email_template?: string;
  summary_email_template?: string;
}

// Get schedule for a user
export const getSchedule = async (userId: string): Promise<Schedule | null> => {
    try {
        const response = await fetch(`/api/schedules?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch schedule');
        }
        const data = await response.json();
        return data.schedule;
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return null;
    }
};

// Add a new schedule
export const addSchedule = async (userId: string, data: CreateScheduleData): Promise<string> => {
    try {
        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                ...data,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to create schedule');
        }
        
        const result = await response.json();
        return result.schedule_id;
    } catch (error) {
        console.error('Error creating schedule:', error);
        throw error;
    }
};

// Update a schedule
export const updateSchedule = async (userId: string, scheduleId: string, data: Partial<CreateScheduleData>): Promise<void> => {
    try {
        const response = await fetch('/api/schedules', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                scheduleId,
                ...data,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update schedule');
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
        throw error;
    }
};

// Delete a schedule
export const deleteSchedule = async (userId: string, scheduleId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/schedules?scheduleId=${scheduleId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete schedule');
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        throw error;
    }
};
