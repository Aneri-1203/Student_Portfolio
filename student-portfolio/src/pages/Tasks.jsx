import { useEffect, useState } from 'react';
import './Tasks.css';

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from '../api';

const emptyForm = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: ''
};

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // ========================================
    // GET ALL TASKS
    // ========================================

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getTasks();

            setTasks(data);
        } catch (err) {
            setError(
                err.message ||
                'Unable to load tasks. Make sure the backend is running.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // ========================================
    // FORM INPUT
    // ========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ========================================
    // OPEN ADD FORM
    // ========================================

    const handleAddTask = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError('');
    };

    // ========================================
    // OPEN EDIT FORM
    // ========================================

    const handleEditTask = (task) => {
        setEditingId(task._id);

        setForm({
            title: task.title || '',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            dueDate: task.dueDate
                ? task.dueDate.substring(0, 10)
                : ''
        });

        setShowForm(true);
        setError('');
    };

    // ========================================
    // CANCEL FORM
    // ========================================

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    // ========================================
    // CREATE / UPDATE TASK
    // ========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            setError('Task title is required.');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const taskData = {
                title: form.title.trim(),
                description: form.description,
                status: form.status,
                priority: form.priority,
                dueDate: form.dueDate || null,
                completed: form.status === 'completed'
            };

            // UPDATE
            if (editingId) {
                await updateTask(editingId, taskData);

                window.alert('Task updated successfully!');
            }

            // CREATE
            else {
                await createTask(taskData);

                window.alert('Task created successfully!');
            }

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);

            await fetchTasks();

        } catch (err) {
            setError(
                err.message ||
                'Unable to save task.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================
    // DELETE TASK
    // ========================================

    const handleDeleteTask = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this task?'
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(id);
            setError('');

            await deleteTask(id);

            window.alert('Task deleted successfully!');

            await fetchTasks();

        } catch (err) {
            setError(
                err.message ||
                'Unable to delete task.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    // ========================================
    // RENDER
    // ========================================

    return (
        <main className="tasks-page">
            <section>

                <p className="section-label">
                    TASK MANAGER
                </p>

                <div className="tasks-heading">

                    <div>
                        <h1>My Tasks</h1>

                        <p>
                            Tasks stored using MongoDB and managed
                            through my Express REST API.
                        </p>
                    </div>

                    <div className="tasks-actions">

                        <button
                            className="add-task-btn"
                            onClick={handleAddTask}
                        >
                            + Add Task
                        </button>

                        <button
                            className="retry-btn"
                            onClick={fetchTasks}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>

                    </div>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="error-box task-error">

                        <p>{error}</p>

                        <button
                            className="retry-btn"
                            onClick={() => setError('')}
                        >
                            Close
                        </button>

                    </div>
                )}

                {/* ADD / EDIT FORM */}

                {showForm && (
                    <div className="task-form-card">

                        <div className="task-form-header">

                            <div>

                                <p className="section-label">
                                    {editingId
                                        ? 'EDIT TASK'
                                        : 'NEW TASK'}
                                </p>

                                <h2>
                                    {editingId
                                        ? 'Edit Task'
                                        : 'Create a Task'}
                                </h2>

                            </div>

                            <button
                                className="close-form-btn"
                                onClick={handleCancel}
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* TITLE */}

                            <label>
                                Title

                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Enter task title"
                                    required
                                />

                            </label>

                            {/* DESCRIPTION */}

                            <label>
                                Description

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Enter task description"
                                    rows="3"
                                />

                            </label>

                            <div className="task-form-row">

                                {/* STATUS */}

                                <label>
                                    Status

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="incomplete">
                                            Incomplete
                                        </option>

                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>

                                </label>

                                {/* PRIORITY */}

                                <label>
                                    Priority

                                    <select
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="low">
                                            Low
                                        </option>

                                        <option value="medium">
                                            Medium
                                        </option>

                                        <option value="high">
                                            High
                                        </option>
                                    </select>

                                </label>

                            </div>

                            {/* DUE DATE */}

                            <label>
                                Due Date

                                <input
                                    type="date"
                                    name="dueDate"
                                    value={form.dueDate}
                                    onChange={handleChange}
                                />

                            </label>

                            {/* FORM BUTTONS */}

                            <div className="task-form-buttons">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-task-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingId
                                            ? 'Save Changes'
                                            : 'Create Task'}
                                </button>

                            </div>

                        </form>

                    </div>
                )}

                {/* LOADING */}

                {loading && (
                    <div className="empty-state">
                        Loading tasks...
                    </div>
                )}

                {/* NO TASKS */}

                {!loading &&
                    !error &&
                    tasks.length === 0 && (

                        <div className="empty-state">

                            <h3>No tasks yet</h3>

                            <p>
                                Create your first task to get started.
                            </p>

                            <button
                                className="add-task-btn"
                                onClick={handleAddTask}
                            >
                                + Add Your First Task
                            </button>

                        </div>
                    )}

                {/* TASK LIST */}

                {!loading &&
                    tasks.length > 0 && (

                        <div className="tasks-grid">

                            {tasks.map((task) => (

                                <div
                                    className="task-card"
                                    key={task._id}
                                >

                                    <div className="task-card-top">

                                        <span
                                            className={`task-priority priority-${task.priority}`}
                                        >
                                            {task.priority}
                                        </span>

                                        <span
                                            className={`task-status status-${task.status}`}
                                        >
                                            {task.status}
                                        </span>

                                    </div>

                                    <h3>
                                        {task.title}
                                    </h3>

                                    {task.description && (
                                        <p className="task-description">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="task-meta">

                                        <span>
                                            {task.completed
                                                ? '✓ Completed'
                                                : '○ Not completed'}
                                        </span>

                                        {task.dueDate && (
                                            <span>
                                                Due:{' '}
                                                {new Date(
                                                    task.dueDate
                                                ).toLocaleDateString()}
                                            </span>
                                        )}

                                    </div>

                                    <div className="task-card-buttons">

                                        <button
                                            className="edit-task-btn"
                                            onClick={() =>
                                                handleEditTask(task)
                                            }
                                            disabled={deletingId === task._id}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="delete-task-btn"
                                            onClick={() =>
                                                handleDeleteTask(task._id)
                                            }
                                            disabled={deletingId === task._id}
                                        >
                                            {deletingId === task._id
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>
                    )}

            </section>
        </main>
    );
}

export default Tasks;