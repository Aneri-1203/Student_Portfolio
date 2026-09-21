const API_BASE_URL = 'http://localhost:5000';

/* =========================
   HELPER
========================= */

const getToken = () => {
    return localStorage.getItem('token');
};

const getAuthHeaders = () => {
    const token = getToken();

    return token
        ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
        : {
              'Content-Type': 'application/json'
          };
};


/* =========================
   AUTH
========================= */

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Registration failed'
        );
    }

    return data;
};


export const loginUser = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Login failed'
        );
    }

    return data;
};


export const googleLogin = async (credential, work = '') => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            credential,
            work
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Google login failed'
        );
    }

    return data;
};


export const getCurrentUser = async () => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to get current user'
        );
    }

    return data;
};


export const forgotPassword = async (email) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to process password reset'
        );
    }

    return data;
};


export const resetPassword = async (token, password) => {
    const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                password
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to reset password'
        );
    }

    return data;
};


/* =========================
   TASKS
========================= */

export const getTasks = async () => {
    const response = await fetch(`${API_BASE_URL}/tasks`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Failed to fetch tasks'
        );
    }

    return data.data || [];
};


export const createTask = async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                data.error ||
                'Failed to create task'
        );
    }

    return data.data;
};


export const updateTask = async (id, taskData) => {
    const response = await fetch(
        `${API_BASE_URL}/tasks/${id}`,
        {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                data.error ||
                'Failed to update task'
        );
    }

    return data.data;
};


export const deleteTask = async (id) => {
    const response = await fetch(
        `${API_BASE_URL}/tasks/${id}`,
        {
            method: 'DELETE',
            headers: getAuthHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                data.error ||
                'Failed to delete task'
        );
    }

    return data;
};