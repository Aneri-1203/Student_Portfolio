import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    adminGetUsers, adminGetTasks,
    adminUpdateUserRole, adminDeleteUser,
    updateTask, deleteTask
} from '../api';
import './Admin.css';

function Admin() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('tasks'); // 'tasks' | 'users'

    // Tasks state
    const [tasks, setTasks] = useState([]);
    const [taskStats, setTaskStats] = useState({});
    const [taskFilters, setTaskFilters] = useState({ priority: '', status: '', sort: '' });
    const [tasksLoading, setTasksLoading] = useState(true);
    const [taskError, setTaskError] = useState('');

    // Users state
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [usersLoading, setUsersLoading] = useState(false);
    const [userError, setUserError] = useState('');

    // Redirect if not admin
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            navigate('/tasks');
        }
    }, [user, isAdmin, authLoading, navigate]);

    // Load tasks
    const fetchTasks = useCallback(async () => {
        try {
            setTasksLoading(true);
            setTaskError('');
            const params = {};
            if (taskFilters.priority) params.priority = taskFilters.priority;
            if (taskFilters.status) params.status = taskFilters.status;
            if (taskFilters.sort) params.sort = taskFilters.sort;
            const data = await adminGetTasks(params);
            setTasks(data.data || []);
            setTaskStats(data.stats || {});
        } catch (err) {
            setTaskError(err.message || 'Failed to load tasks');
        } finally {
            setTasksLoading(false);
        }
    }, [taskFilters]);

    useEffect(() => {
        if (isAdmin) fetchTasks();
    }, [fetchTasks, isAdmin]);

    // Load users
    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            setUserError('');
            const params = {};
            if (userSearch) params.search = userSearch;
            const data = await adminGetUsers(params);
            setUsers(data.data || []);
        } catch (err) {
            setUserError(err.message || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, [userSearch]);

    useEffect(() => {
        if (isAdmin && tab === 'users') fetchUsers();
    }, [fetchUsers, isAdmin, tab]);

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            await updateTask(taskId, { status: newStatus });
            fetchTasks();
        } catch (err) {
            setTaskError(err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task? This cannot be undone.')) return;
        try {
            await deleteTask(taskId);
            fetchTasks();
        } catch (err) {
            setTaskError(err.message);
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await adminUpdateUserRole(userId, role);
            fetchUsers();
        } catch (err) {
            setUserError(err.message);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Delete user "${userName}" and all their tasks? This cannot be undone.`)) return;
        try {
            await adminDeleteUser(userId);
            fetchUsers();
        } catch (err) {
            setUserError(err.message);
        }
    };

    const now = new Date();
    const isOverdue = (task) => !task.completed && task.dueDate && new Date(task.dueDate) < now;

    if (authLoading) return <div className="empty-state">Loading…</div>;
    if (!isAdmin) return null;

    return (
        <main className="admin-page">
            <section>
                <p className="section-label">Admin</p>
                <h1 className="admin-title">Dashboard</h1>
                <p className="admin-subtitle">
                    Logged in as <strong>{user?.name}</strong> · {user?.email}
                </p>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <span className="stat-num">{taskStats.total ?? '—'}</span>
                        <span className="stat-label">Total Tasks</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-num">{taskStats.pending ?? '—'}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-num">{taskStats.completed ?? '—'}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-card stat-overdue">
                        <span className="stat-num">{taskStats.overdue ?? '—'}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${tab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setTab('tasks')}
                    >
                        All Tasks
                    </button>
                    <button
                        className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
                        onClick={() => setTab('users')}
                    >
                        Users
                    </button>
                </div>

                {/* ===== TASKS TAB ===== */}
                {tab === 'tasks' && (
                    <div className="admin-panel">
                        <div className="admin-filters">
                            <select
                                value={taskFilters.priority}
                                onChange={e => setTaskFilters(p => ({ ...p, priority: e.target.value }))}
                            >
                                <option value="">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <select
                                value={taskFilters.status}
                                onChange={e => setTaskFilters(p => ({ ...p, status: e.target.value }))}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="incomplete">Incomplete</option>
                                <option value="completed">Completed</option>
                            </select>

                            <select
                                value={taskFilters.sort}
                                onChange={e => setTaskFilters(p => ({ ...p, sort: e.target.value }))}
                            >
                                <option value="">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="deadline">By Deadline</option>
                            </select>

                            <button className="retry-btn" onClick={fetchTasks} disabled={tasksLoading}>
                                {tasksLoading ? 'Loading…' : 'Refresh'}
                            </button>
                        </div>

                        {taskError && <div className="auth-error"><p>{taskError}</p></div>}

                        {tasksLoading && <div className="empty-state">Loading tasks…</div>}

                        {!tasksLoading && tasks.length === 0 && (
                            <div className="empty-state">No tasks found.</div>
                        )}

                        {!tasksLoading && tasks.map(task => (
                            <div
                                key={task._id}
                                className={`admin-task-card ${isOverdue(task) ? 'overdue' : ''}`}
                            >
                                <div className="admin-task-top">
                                    <span className={`task-priority priority-${task.priority}`}>
                                        {task.priority}
                                    </span>
                                    <span className={`task-status status-${task.status}`}>
                                        {task.status}
                                    </span>
                                    {isOverdue(task) && (
                                        <span className="overdue-badge">OVERDUE</span>
                                    )}
                                </div>

                                <h3>{task.title}</h3>

                                {task.description && (
                                    <p className="task-description">{task.description}</p>
                                )}

                                <div className="admin-task-meta">
                                    <span>
                                        By: <strong>{task.createdBy?.name || 'Unknown'}</strong>
                                        {' '}({task.createdBy?.email || ''})
                                    </span>
                                    {task.dueDate && (
                                        <span>
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span>
                                        Created: {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="admin-task-actions">
                                    <select
                                        value={task.status}
                                        onChange={e => handleTaskStatusChange(task._id, e.target.value)}
                                        className="status-select"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="incomplete">Incomplete</option>
                                        <option value="completed">Completed</option>
                                    </select>

                                    <button
                                        className="delete-task-btn"
                                        onClick={() => handleDeleteTask(task._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===== USERS TAB ===== */}
                {tab === 'users' && (
                    <div className="admin-panel">
                        <div className="admin-filters">
                            <input
                                type="text"
                                placeholder="Search by name or email…"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="admin-search"
                            />
                            <button className="retry-btn" onClick={fetchUsers} disabled={usersLoading}>
                                {usersLoading ? 'Loading…' : 'Search'}
                            </button>
                        </div>

                        {userError && <div className="auth-error"><p>{userError}</p></div>}

                        {usersLoading && <div className="empty-state">Loading users…</div>}

                        {!usersLoading && users.length === 0 && (
                            <div className="empty-state">No users found.</div>
                        )}

                        {!usersLoading && users.map(u => (
                            <div key={u._id} className="admin-user-card">
                                <div className="admin-user-info">
                                    {u.profileImage && (
                                        <img
                                            src={u.profileImage}
                                            alt={u.name}
                                            className="admin-user-avatar"
                                        />
                                    )}
                                    <div>
                                        <strong>{u.name}</strong>
                                        <p className="admin-user-email">{u.email}</p>
                                        <div className="admin-user-meta">
                                            <span className={`role-badge role-${u.role}`}>{u.role}</span>
                                            <span className={`verified-badge ${u.isEmailVerified ? 'verified' : 'unverified'}`}>
                                                {u.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
                                            </span>
                                            {u.googleId && <span className="google-badge">Google</span>}
                                            <span className="admin-user-date">
                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-user-actions">
                                    {u._id !== user?.id && (
                                        <>
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u._id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="student">Student</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                className="delete-task-btn"
                                                onClick={() => handleDeleteUser(u._id, u.name)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    {u._id === user?.id && (
                                        <span className="auth-subtitle" style={{ fontSize: '11px' }}>
                                            (you)
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Admin;
