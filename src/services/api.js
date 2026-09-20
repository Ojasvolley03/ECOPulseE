const API_BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('ecopulse_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('ecopulse_token', token);
  } else {
    localStorage.removeItem('ecopulse_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle JSON body if not FormData
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `HTTP Error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  getAdminStatus: () => request('/auth/admin-status'),
  getAdminAccess: () => request('/auth/admin-access'),
  setupAdmin: (credentials) => request('/auth/setup-admin', { method: 'POST', body: credentials }),
  changeAdminCredentials: (credentials) => request('/auth/change-admin-credentials', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),

  // Bins
  getBins: () => request('/bins'),
  getBinById: (id) => request(`/bins/${id}`),
  getBinByCode: (code) => request(`/bins/code/${code}`),
  createBin: (binData) => request('/bins', { method: 'POST', body: binData }),
  updateBin: (id, binData) => request(`/bins/${id}`, { method: 'PUT', body: binData }),
  deleteBin: (id) => request(`/bins/${id}`, { method: 'DELETE' }),

  // Fleet Vehicles & Live Tracking
  getVehicles: () => request('/vehicles'),
  createVehicle: (vehicleData) => request('/vehicles', { method: 'POST', body: vehicleData }),
  updateVehicle: (id, vehicleData) => request(`/vehicles/${id}`, { method: 'PUT', body: vehicleData }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  updateVehicleLocation: (id, data) => request(`/vehicles/${id}/location`, { method: 'PUT', body: data }),
  getOptimizedRoute: (params = '') => request(`/vehicles/route${params}`),

  // Sensors
  addSensorReading: (reading) => request('/sensors/reading', { method: 'POST', body: reading }),
  getSensorReadings: (binId) => request(`/sensors/readings${binId ? `?bin_id=${binId}` : ''}`),

  // Complaints
  getComplaints: (params = '') => request(`/complaints${params}`),
  createComplaint: (formData) => request('/complaints', { method: 'POST', body: formData }),
  updateComplaintStatus: (id, data) => request(`/complaints/${id}/status`, { method: 'PUT', body: data }),

  // Tasks
  getTasks: (params = '') => request(`/tasks${params}`),
  createTask: (taskData) => request('/tasks', { method: 'POST', body: taskData }),
  assignTask: (id, workerId) => request(`/tasks/${id}/assign`, { method: 'PUT', body: { worker_id: workerId } }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PUT', body: { status } }),

  // Users & Workers
  getUsers: (role) => request(`/users${role ? `?role=${role}` : ''}`),
  getWorkers: () => request('/users/workers'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // AI Services
  classifyWasteImage: (formDataOrJson) => request('/ai/classify-image', { method: 'POST', body: formDataOrJson }),
  analyzeComplaint: (description) => request('/ai/analyze-complaint', { method: 'POST', body: { description } }),
  predictCriticalBins: () => request('/ai/predict-critical'),

  // Simulator Controls
  getSimulatorStatus: () => request('/simulator/status'),
  startSimulator: (interval) => request('/simulator/start', { method: 'POST', body: { interval } }),
  stopSimulator: () => request('/simulator/stop', { method: 'POST' }),
  manualSimulateBin: (simData) => request('/simulator/manual-update', { method: 'POST', body: simData }),
};
