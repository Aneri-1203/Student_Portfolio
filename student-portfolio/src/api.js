const API_BASE_URL = 'http://localhost:5000';

export const getTasks = async () => {
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
        throw new Error('Failed to fetch tasks');
    }

    return response.json();
};


export const createTask = async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || data.error || 'Failed to create task'
        );
    }

    return data;
};


export const updateTask = async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || data.error || 'Failed to update task'
        );
    }

    return data;
};


export const deleteTask = async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || data.error || 'Failed to delete task'
        );
    }

    return data;
};