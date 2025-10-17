export interface Target {
  target_id: string;
  user_id: string;
  daily_target: number;
  current_date: Date;
  applications_done: number;
  status_color: 'Green' | 'Yellow' | 'Red';
}

export interface CreateTargetData {
  daily_target: number;
  current_date: Date;
  applications_done: number;
  status_color: 'Green' | 'Yellow' | 'Red';
}

// Get all targets for a user
export const getTargets = async (userId: string): Promise<Target[]> => {
    try {
        const response = await fetch(`/api/targets?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch targets');
        }
        const data = await response.json();
        return data.targets;
    } catch (error) {
        console.error('Error fetching targets:', error);
        return [];
    }
};

// Get today's target for a user
export const getTodayTarget = async (userId: string): Promise<Target | null> => {
    try {
        const response = await fetch(`/api/targets?userId=${userId}&today=true`);
        if (!response.ok) {
            throw new Error('Failed to fetch today target');
        }
        const data = await response.json();
        return data.target;
    } catch (error) {
        console.error('Error fetching today target:', error);
        return null;
    }
};

// Add a new target
export const addTarget = async (userId: string, data: CreateTargetData): Promise<string> => {
    try {
        const response = await fetch('/api/targets', {
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
            throw new Error('Failed to create target');
        }
        
        const result = await response.json();
        return result.target_id;
    } catch (error) {
        console.error('Error creating target:', error);
        throw error;
    }
};

// Update a target
export const updateTarget = async (userId: string, targetId: string, data: Partial<CreateTargetData>): Promise<void> => {
    try {
        const response = await fetch('/api/targets', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetId,
                ...data,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update target');
        }
    } catch (error) {
        console.error('Error updating target:', error);
        throw error;
    }
};

// Delete a target
export const deleteTarget = async (userId: string, targetId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/targets?targetId=${targetId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete target');
        }
    } catch (error) {
        console.error('Error deleting target:', error);
        throw error;
    }
};
