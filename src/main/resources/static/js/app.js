/**
 * EMPSPHERE HR & EMPLOYEE MANAGEMENT SYSTEM - FRONTEND APP ENGINE
 * Features: JWT Authentication, Spring Data Server-side Pagination, OTP Security, Swagger Docs Integration
 */

(function () {
  'use strict';

  // State Store
  const state = {
    employees: [],
    departments: [],
    demoMode: false,
    apiBaseUrl: localStorage.getItem('ems_api_url') || 'http://localhost:8088',
    jwtToken: localStorage.getItem('ems_jwt_token') || '',
    userEmail: localStorage.getItem('ems_user_email') || '',
    userName: localStorage.getItem('ems_user_name') || 'Guest User',
    userRole: localStorage.getItem('ems_user_role') || 'UNAUTHENTICATED',
    currentTab: 'dashboard-tab',
    searchTerm: '',
    deptFilter: 'ALL',
    sortBy: 'name',
    direction: 'asc',
    currentPage: 0, // 0-indexed for Spring Data
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
    pendingDeleteEmail: null,
    pendingDeleteAll: false,
    activities: [
      { text: 'System initialized with JWT Authentication and Spring Data Pagination', time: 'Just now', icon: 'ri-shield-keyhole-line' }
    ]
  };

  // Sample Mock Employees for Standalone / Demo Mode
  const MOCK_EMPLOYEES = [
    { name: 'Alexander Wright', email: 'alex.wright@tcs.com', dept: 'Engineering', salary: 92000 },
    { name: 'Sarah Jenkins', email: 's.jenkins@tcs.com', dept: 'Human Resources', salary: 68000 },
    { name: 'Michael Chen', email: 'm.chen@tcs.com', dept: 'Engineering', salary: 105000 },
    { name: 'Emily Rodriguez', email: 'e.rodriguez@tcs.com', dept: 'Finance', salary: 84000 },
    { name: 'David Kim', email: 'david.kim@tcs.com', dept: 'Marketing', salary: 72000 },
    { name: 'Priya Sharma', email: 'priya.s@tcs.com', dept: 'Engineering', salary: 98000 },
    { name: 'James Wilson', email: 'j.wilson@tcs.com', dept: 'Finance', salary: 89000 },
    { name: 'Olivia Taylor', email: 'olivia.t@tcs.com', dept: 'Human Resources', salary: 64000 }
  ];

  // DOM Elements
  const DOM = {
    // Navigation & Layout
    navBtns: document.querySelectorAll('.nav-btn'),
    pages: document.querySelectorAll('.view-page'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    refreshDataBtn: document.getElementById('refresh-data-btn'),
    demoModeToggle: document.getElementById('demo-mode-toggle'),
    apiStatusDot: document.getElementById('api-status-dot'),
    apiModeText: document.getElementById('api-mode-text'),
    headerUsername: document.getElementById('header-username'),
    headerAvatar: document.getElementById('header-avatar'),
    headerRole: document.getElementById('header-role'),
    authActionBtn: document.getElementById('auth-action-btn'),
    authActionIcon: document.getElementById('auth-action-icon'),
    authActionText: document.getElementById('auth-action-text'),

    // Dashboard Elements
    statTotalEmployees: document.getElementById('stat-total-employees'),
    statTotalPayroll: document.getElementById('stat-total-payroll'),
    statAvgSalary: document.getElementById('stat-avg-salary'),
    statDeptCount: document.getElementById('stat-dept-count'),
    deptSummaryCount: document.getElementById('dept-summary-count'),
    dashboardDeptList: document.getElementById('dashboard-dept-list'),
    activityFeed: document.getElementById('activity-feed'),
    dashAddEmpBtn: document.getElementById('dash-add-emp-btn'),
    dashRegUserBtn: document.getElementById('dash-reg-user-btn'),
    dashDeleteAllBtn: document.getElementById('dash-delete-all-btn'),

    // Directory Elements
    searchInput: document.getElementById('employee-search-input'),
    deptFilterSelect: document.getElementById('dept-filter-select'),
    sortSelect: document.getElementById('sort-select'),
    pageSizeSelect: document.getElementById('page-size-select'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    openAddEmpModalBtn: document.getElementById('open-add-emp-modal-btn'),
    employeeTableBody: document.getElementById('employee-table-body'),
    paginationInfo: document.getElementById('pagination-info'),
    paginationButtons: document.getElementById('pagination-buttons'),

    // Forms
    userLoginForm: document.getElementById('user-login-form'),
    loginEmailInput: document.getElementById('login-email'),
    loginPasswordInput: document.getElementById('login-password'),
    modalLoginForm: document.getElementById('modal-login-form'),
    modalLoginEmailInput: document.getElementById('modal-login-email'),
    modalLoginPasswordInput: document.getElementById('modal-login-password'),

    userRegisterForm: document.getElementById('user-register-form'),
    regNameInput: document.getElementById('reg-name'),
    regEmailInput: document.getElementById('reg-email'),
    regPasswordInput: document.getElementById('reg-password'),
    regRoleSelect: document.getElementById('reg-role'),

    verifyOtpForm: document.getElementById('verify-otp-form'),
    otpEmailInput: document.getElementById('otp-email'),
    otpDigits: document.querySelectorAll('.otp-digit'),
    resendOtpBtn: document.getElementById('resend-otp-btn'),

    // Settings
    apiBaseUrlInput: document.getElementById('api-base-url'),
    jwtTokenDisplay: document.getElementById('jwt-token-display'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    testConnectionBtn: document.getElementById('test-connection-btn'),

    // Modals
    employeeModal: document.getElementById('employee-modal'),
    empModalTitle: document.getElementById('emp-modal-title'),
    employeeForm: document.getElementById('employee-form'),
    empEditOriginalEmail: document.getElementById('emp-edit-original-email'),
    empEmailInput: document.getElementById('emp-email'),
    empNameInput: document.getElementById('emp-name'),
    empDeptInput: document.getElementById('emp-dept'),
    empSalaryInput: document.getElementById('emp-salary'),

    deleteModal: document.getElementById('delete-modal'),
    deleteModalTitle: document.getElementById('delete-modal-title'),
    deleteModalMsg: document.getElementById('delete-modal-msg'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),

    loginModal: document.getElementById('login-modal'),
    toastContainer: document.getElementById('toast-container')
  };

  /* ==========================================================================
     API SERVICE LAYER
     ========================================================================== */
  const ApiService = {
    getHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      if (state.jwtToken) {
        headers['Authorization'] = `Bearer ${state.jwtToken}`;
      }
      return headers;
    },

    async parseResponse(response) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    },

    async login(email, password) {
      if (state.demoMode) {
        state.jwtToken = 'demo-jwt-token-sample';
        state.userEmail = email;
        state.userName = email.split('@')[0];
        state.userRole = 'ROLE_ADMIN';
        saveAuthState();
        updateUserUI();
        logActivity(`Signed in as ${state.userName} (Demo)`, 'ri-login-box-line');
        return { message: 'Login successful (Demo Mode)' };
      }

      const response = await fetch(`${state.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await this.parseResponse(response);

      if (!response.ok) {
        const errorMsg = data.message || data.error || (typeof data === 'string' ? data : 'Authentication failed');
        throw new Error(errorMsg);
      }

      state.jwtToken = data.token;
      state.userEmail = data.email;
      state.userName = data.name;
      state.userRole = data.role;
      saveAuthState();
      updateUserUI();
      logActivity(`Logged in successfully as ${state.userName}`, 'ri-shield-check-line');
      return data;
    },

    async fetchEmployees() {
      if (state.demoMode) {
        return {
          content: [...MOCK_EMPLOYEES],
          pageNo: 0,
          pageSize: state.pageSize,
          totalElements: MOCK_EMPLOYEES.length,
          totalPages: 1,
          last: true
        };
      }

      const queryParams = new URLSearchParams({
        page: state.currentPage,
        size: state.pageSize,
        sortBy: state.sortBy,
        direction: state.direction
      });

      if (state.searchTerm) queryParams.append('search', state.searchTerm);
      if (state.deptFilter && state.deptFilter !== 'ALL') queryParams.append('dept', state.deptFilter);

      try {
        const response = await fetch(`${state.apiBaseUrl}/employees?${queryParams.toString()}`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (response.status === 401 || response.status === 403) {
          updateApiStatus(false, 'Unauthorized');
          showToast('Authentication required. Please login.', 'warning');
          openModal(DOM.loginModal);
          throw new Error('Unauthorized');
        }

        if (!response.ok) {
          const errData = await this.parseResponse(response);
          throw new Error(errData.message || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        updateApiStatus(true, 'Live Server');
        return data;
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          console.warn('API fetch failed, falling back to demo state:', err.message);
          updateApiStatus(false, 'Offline / Demo');
        }
        throw err;
      }
    },

    async fetchDepartments() {
      if (state.demoMode) return Array.from(new Set(MOCK_EMPLOYEES.map(e => e.dept)));

      try {
        const response = await fetch(`${state.apiBaseUrl}/employees/departments`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        // ignore
      }
      return [];
    },

    async createEmployee(employeeData) {
      if (state.demoMode) {
        MOCK_EMPLOYEES.push(employeeData);
        logActivity(`Created employee ${employeeData.name} (Demo)`, 'ri-user-add-line');
        return { name: employeeData.name, email: employeeData.email };
      }

      const response = await fetch(`${state.apiBaseUrl}/employees`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(employeeData)
      });

      const data = await this.parseResponse(response);
      if (!response.ok) {
        const msg = data.fieldErrors ? Object.values(data.fieldErrors).join(', ') : (data.message || 'Failed to create employee');
        throw new Error(msg);
      }

      logActivity(`Created employee ${employeeData.name}`, 'ri-user-add-line');
      return data;
    },

    async updateEmployee(email, employeeData) {
      if (state.demoMode) {
        const index = MOCK_EMPLOYEES.findIndex(e => e.email === email);
        if (index !== -1) MOCK_EMPLOYEES[index] = employeeData;
        logActivity(`Updated record for ${employeeData.name} (Demo)`, 'ri-edit-line');
        return employeeData;
      }

      const response = await fetch(`${state.apiBaseUrl}/employees/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(employeeData)
      });

      const data = await this.parseResponse(response);
      if (!response.ok) {
        const msg = data.fieldErrors ? Object.values(data.fieldErrors).join(', ') : (data.message || 'Failed to update employee');
        throw new Error(msg);
      }

      logActivity(`Updated record for ${employeeData.name}`, 'ri-edit-line');
      return data;
    },

    async deleteEmployee(email) {
      if (state.demoMode) {
        const idx = MOCK_EMPLOYEES.findIndex(e => e.email === email);
        if (idx !== -1) MOCK_EMPLOYEES.splice(idx, 1);
        logActivity(`Deleted record ${email} (Demo)`, 'ri-delete-bin-line');
        return 'Data deleted';
      }

      const response = await fetch(`${state.apiBaseUrl}/employees/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await this.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Failed to delete employee');

      logActivity(`Deleted employee record (${email})`, 'ri-delete-bin-line');
      return data.message || 'Deleted successfully';
    },

    async deleteAllEmployees() {
      if (state.demoMode) {
        MOCK_EMPLOYEES.length = 0;
        logActivity('Purged all records (Demo)', 'ri-delete-bin-2-line');
        return 'All records purged';
      }

      const response = await fetch(`${state.apiBaseUrl}/employees`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await this.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Failed to clear employees');

      logActivity('Purged all employee records', 'ri-delete-bin-2-line');
      return data.message || 'All records deleted';
    },

    async registerUser(userData) {
      if (state.demoMode) {
        logActivity(`Registered user ${userData.name} (Demo)`, 'ri-user-follow-line');
        return 'User registered successfully. Check email for OTP (Demo Code: 123456)';
      }

      const response = await fetch(`${state.apiBaseUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await this.parseResponse(response);
      if (!response.ok) {
        const msg = data.fieldErrors ? Object.values(data.fieldErrors).join(', ') : (data.message || 'Registration failed');
        throw new Error(msg);
      }

      logActivity(`Registered user ${userData.name}`, 'ri-user-follow-line');
      return data.message || 'Registration initiated';
    },

    async verifyOtp(otpData) {
      if (state.demoMode) {
        logActivity(`Verified OTP for ${otpData.email} (Demo)`, 'ri-checkbox-circle-fill');
        return 'OTP verified successfully! Account activated.';
      }

      const response = await fetch(`${state.apiBaseUrl}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otpData)
      });

      const data = await this.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');

      logActivity(`Verified OTP for ${otpData.email}`, 'ri-checkbox-circle-fill');
      return data.message || 'OTP Verified successfully';
    },

    async resendOtp(email) {
      if (state.demoMode) {
        return 'New OTP code sent (Demo Code: 654321)';
      }

      const response = await fetch(`${state.apiBaseUrl}/users/resend-otp?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });

      const data = await this.parseResponse(response);
      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');

      return data.message || 'OTP resent successfully';
    }
  };

  /* ==========================================================================
     UI RENDER ENGINE
     ========================================================================== */
  async function loadData() {
    try {
      const data = await ApiService.fetchEmployees();
      state.employees = data.content || [];
      state.totalElements = data.totalElements || state.employees.length;
      state.totalPages = data.totalPages || 1;

      const depts = await ApiService.fetchDepartments();
      if (depts && depts.length > 0) {
        state.departments = depts;
      } else {
        state.departments = Array.from(new Set(state.employees.map(e => e.dept)));
      }

      renderAll();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('Error loading workforce data: ' + err.message, 'danger');
      }
    }
  }

  function renderAll() {
    renderDashboard();
    renderDepartmentOptions();
    renderEmployeeTable();
    renderActivities();
  }

  function renderDashboard() {
    const list = state.employees;
    const totalCount = state.totalElements;
    const totalPayroll = list.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const avgSalary = list.length > 0 ? totalPayroll / list.length : 0;

    const deptMap = {};
    list.forEach(e => {
      const d = e.dept || 'General';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const deptCount = state.departments.length || Object.keys(deptMap).length;

    DOM.statTotalEmployees.textContent = totalCount.toLocaleString();
    DOM.statTotalPayroll.textContent = '$' + totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    DOM.statAvgSalary.textContent = '$' + avgSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    DOM.statDeptCount.textContent = deptCount;
    DOM.deptSummaryCount.textContent = `${deptCount} Active Departments`;

    DOM.dashboardDeptList.innerHTML = '';
    if (Object.keys(deptMap).length === 0) {
      DOM.dashboardDeptList.innerHTML = `
        <div class="empty-state">
          <i class="ri-pie-chart-line"></i>
          <h4>No Department Data</h4>
          <p>Add employees to view department metrics</p>
        </div>`;
      return;
    }

    Object.entries(deptMap).forEach(([dept, count]) => {
      const percentage = Math.round((count / (list.length || 1)) * 100);
      const item = document.createElement('div');
      item.className = 'dept-item';
      item.innerHTML = `
        <div class="dept-meta">
          <span>${dept}</span>
          <span style="color: var(--text-muted);">${count} emp (${percentage}%)</span>
        </div>
        <div class="dept-progress-bg">
          <div class="dept-progress-fill" style="width: ${percentage}%;"></div>
        </div>`;
      DOM.dashboardDeptList.appendChild(item);
    });
  }

  function renderDepartmentOptions() {
    const currentSelection = DOM.deptFilterSelect.value;
    let html = `<option value="ALL">All Departments</option>`;
    
    state.departments.forEach(d => {
      if (d) html += `<option value="${d}">${d}</option>`;
    });

    DOM.deptFilterSelect.innerHTML = html;
    DOM.deptFilterSelect.value = currentSelection;
  }

  function renderEmployeeTable() {
    DOM.employeeTableBody.innerHTML = '';

    if (state.employees.length === 0) {
      DOM.employeeTableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="ri-user-search-line"></i>
              <h4>No Employees Found</h4>
              <p>Try adjusting your search query or department filter</p>
            </div>
          </td>
        </tr>`;
      DOM.paginationInfo.textContent = `Showing 0 of ${state.totalElements} employees`;
      DOM.paginationButtons.innerHTML = '';
      return;
    }

    state.employees.forEach(emp => {
      const initial = (emp.name || 'E').charAt(0).toUpperCase();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="avatar-circle">${initial}</div>
            <div>
              <strong style="display: block; color: var(--text-primary);">${emp.name || 'Unnamed'}</strong>
              <small style="color: var(--text-muted);">${emp.email}</small>
            </div>
          </div>
        </td>
        <td>
          <span class="dept-badge">${emp.dept || 'General'}</span>
        </td>
        <td>
          <span class="salary-tag">$${(Number(emp.salary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </td>
        <td>
          <span class="status-dot"></span> <small style="color: var(--success-color); font-weight: 600;">Active</small>
        </td>
        <td style="text-align: right;">
          <div class="action-buttons" style="justify-content: flex-end;">
            <button class="icon-btn edit-emp-btn" data-email="${emp.email}" title="Edit Record">
              <i class="ri-edit-line"></i>
            </button>
            <button class="icon-btn delete delete-emp-btn" data-email="${emp.email}" data-name="${emp.name}" title="Delete Record">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>`;
      DOM.employeeTableBody.appendChild(row);
    });

    // Pagination Info & Buttons
    const startIdx = state.currentPage * state.pageSize + 1;
    const endIdx = Math.min((state.currentPage + 1) * state.pageSize, state.totalElements);
    DOM.paginationInfo.textContent = `Showing ${state.totalElements > 0 ? startIdx : 0} - ${endIdx} of ${state.totalElements} employees (Page ${state.currentPage + 1} of ${state.totalPages})`;

    let pageBtnsHtml = '';
    pageBtnsHtml += `<button class="btn btn-secondary btn-sm" ${state.currentPage === 0 ? 'disabled' : ''} id="prev-page-btn"><i class="ri-arrow-left-s-line"></i> Prev</button>`;
    
    for (let i = 0; i < state.totalPages; i++) {
      pageBtnsHtml += `<button class="btn btn-sm ${i === state.currentPage ? 'btn-primary' : 'btn-secondary'} page-num-btn" data-page="${i}">${i + 1}</button>`;
    }

    pageBtnsHtml += `<button class="btn btn-secondary btn-sm" ${state.currentPage >= state.totalPages - 1 ? 'disabled' : ''} id="next-page-btn">Next <i class="ri-arrow-right-s-line"></i></button>`;

    DOM.paginationButtons.innerHTML = pageBtnsHtml;

    // Attach Action Listeners
    document.querySelectorAll('.edit-emp-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditEmployeeModal(btn.dataset.email));
    });

    document.querySelectorAll('.delete-emp-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.email, btn.dataset.name));
    });

    document.getElementById('prev-page-btn')?.addEventListener('click', () => {
      if (state.currentPage > 0) {
        state.currentPage--;
        loadData();
      }
    });

    document.getElementById('next-page-btn')?.addEventListener('click', () => {
      if (state.currentPage < state.totalPages - 1) {
        state.currentPage++;
        loadData();
      }
    });

    document.querySelectorAll('.page-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentPage = Number(btn.dataset.page);
        loadData();
      });
    });
  }

  function renderActivities() {
    DOM.activityFeed.innerHTML = '';
    state.activities.slice(0, 5).forEach(act => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-icon">
          <i class="${act.icon || 'ri-notification-3-line'}"></i>
        </div>
        <div class="activity-text">
          <p>${act.text}</p>
          <small>${act.time}</small>
        </div>`;
      DOM.activityFeed.appendChild(item);
    });
  }

  function logActivity(text, icon = 'ri-notification-3-line') {
    state.activities.unshift({
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon
    });
    renderActivities();
  }

  function saveAuthState() {
    localStorage.setItem('ems_jwt_token', state.jwtToken);
    localStorage.setItem('ems_user_email', state.userEmail);
    localStorage.setItem('ems_user_name', state.userName);
    localStorage.setItem('ems_user_role', state.userRole);
  }

  function clearAuthState() {
    state.jwtToken = '';
    state.userEmail = '';
    state.userName = 'Guest User';
    state.userRole = 'UNAUTHENTICATED';
    localStorage.removeItem('ems_jwt_token');
    localStorage.removeItem('ems_user_email');
    localStorage.removeItem('ems_user_name');
    localStorage.removeItem('ems_user_role');
    updateUserUI();
  }

  function updateUserUI() {
    DOM.headerUsername.textContent = state.userName;
    DOM.headerAvatar.textContent = state.userName.charAt(0).toUpperCase();
    DOM.headerRole.textContent = state.userRole;

    if (state.jwtToken) {
      DOM.authActionIcon.className = 'ri-logout-box-line';
      DOM.authActionText.textContent = 'Logout';
      DOM.jwtTokenDisplay.value = state.jwtToken;
    } else {
      DOM.authActionIcon.className = 'ri-login-box-line';
      DOM.authActionText.textContent = 'Login';
      DOM.jwtTokenDisplay.value = '';
    }
  }

  function updateApiStatus(isOnline, text) {
    if (isOnline) {
      DOM.apiStatusDot.className = 'status-dot';
      DOM.apiModeText.textContent = text || 'Live Server';
    } else {
      DOM.apiStatusDot.className = 'status-dot offline';
      DOM.apiModeText.textContent = text || 'Demo Mode';
    }
  }

  /* ==========================================================================
     EVENT HANDLERS & LISTENERS
     ========================================================================== */
  function setupEventListeners() {
    // Nav Tabs
    DOM.navBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Theme Toggle
    DOM.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      DOM.themeIcon.className = nextTheme === 'light' ? 'ri-moon-line' : 'ri-sun-line';
      showToast(`Switched to ${nextTheme} mode`, 'info');
    });

    // Refresh
    DOM.refreshDataBtn.addEventListener('click', () => {
      loadData();
      showToast('Data refreshed', 'info');
    });

    // Demo Mode
    DOM.demoModeToggle.addEventListener('change', (e) => {
      state.demoMode = e.target.checked;
      showToast(state.demoMode ? 'Entered Demo Mode' : 'Switched to Live API Mode', 'info');
      loadData();
    });

    // Login/Logout Header Action
    DOM.authActionBtn.addEventListener('click', () => {
      if (state.jwtToken) {
        clearAuthState();
        showToast('Logged out successfully', 'info');
        loadData();
      } else {
        openModal(DOM.loginModal);
      }
    });

    // Search input
    let searchTimeout;
    DOM.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchTerm = e.target.value.trim();
        state.currentPage = 0;
        loadData();
      }, 300);
    });

    // Filters
    DOM.deptFilterSelect.addEventListener('change', (e) => {
      state.deptFilter = e.target.value;
      state.currentPage = 0;
      loadData();
    });

    DOM.sortSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'name-asc') { state.sortBy = 'name'; state.direction = 'asc'; }
      if (val === 'name-desc') { state.sortBy = 'name'; state.direction = 'desc'; }
      if (val === 'salary-high') { state.sortBy = 'salary'; state.direction = 'desc'; }
      if (val === 'salary-low') { state.sortBy = 'salary'; state.direction = 'asc'; }
      state.currentPage = 0;
      loadData();
    });

    DOM.pageSizeSelect.addEventListener('change', (e) => {
      state.pageSize = Number(e.target.value);
      state.currentPage = 0;
      loadData();
    });

    // Export CSV
    DOM.exportCsvBtn.addEventListener('click', exportToCsv);

    // Quick Actions
    DOM.dashAddEmpBtn.addEventListener('click', () => {
      switchTab('employees-tab');
      openAddEmployeeModal();
    });

    DOM.dashRegUserBtn.addEventListener('click', () => switchTab('auth-tab'));

    DOM.dashDeleteAllBtn.addEventListener('click', () => {
      state.pendingDeleteAll = true;
      DOM.deleteModalTitle.textContent = 'Purge All Employees?';
      DOM.deleteModalMsg.textContent = 'This will delete ALL employee records from the database. Requires ADMIN role.';
      openModal(DOM.deleteModal);
    });

    DOM.openAddEmpModalBtn.addEventListener('click', openAddEmployeeModal);

    // JWT Login Forms (Tab & Modal)
    const handleLoginSubmit = async (email, password, modalToClose) => {
      try {
        const res = await ApiService.login(email, password);
        showToast(res.message || 'Login successful', 'success');
        if (modalToClose) closeModal(modalToClose);
        loadData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };

    DOM.userLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLoginSubmit(DOM.loginEmailInput.value.trim(), DOM.loginPasswordInput.value);
    });

    DOM.modalLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLoginSubmit(DOM.modalLoginEmailInput.value.trim(), DOM.modalLoginPasswordInput.value, DOM.loginModal);
    });

    // Add / Edit Employee Form
    DOM.employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalEmail = DOM.empEditOriginalEmail.value;
      const empData = {
        email: DOM.empEmailInput.value.trim(),
        name: DOM.empNameInput.value.trim(),
        dept: DOM.empDeptInput.value.trim(),
        salary: parseFloat(DOM.empSalaryInput.value)
      };

      try {
        if (originalEmail) {
          await ApiService.updateEmployee(originalEmail, empData);
          showToast('Employee updated successfully', 'success');
        } else {
          await ApiService.createEmployee(empData);
          showToast('Employee created successfully', 'success');
        }
        closeModal(DOM.employeeModal);
        loadData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Delete Modal
    DOM.confirmDeleteBtn.addEventListener('click', async () => {
      try {
        if (state.pendingDeleteAll) {
          const res = await ApiService.deleteAllEmployees();
          showToast(res || 'All records deleted', 'success');
        } else if (state.pendingDeleteEmail) {
          const res = await ApiService.deleteEmployee(state.pendingDeleteEmail);
          showToast(res || 'Employee deleted', 'success');
        }
        closeModal(DOM.deleteModal);
        loadData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Register User Form
    DOM.userRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const regData = {
        name: DOM.regNameInput.value.trim(),
        email: DOM.regEmailInput.value.trim(),
        password: DOM.regPasswordInput.value,
        role: DOM.regRoleSelect.value
      };

      try {
        const res = await ApiService.registerUser(regData);
        showToast(res || 'Registration initiated', 'success');
        DOM.otpEmailInput.value = regData.email;
        DOM.otpDigits[0].focus();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // OTP Input Boxes
    DOM.otpDigits.forEach((digitInput, idx) => {
      digitInput.addEventListener('input', (e) => {
        if (e.target.value && idx < DOM.otpDigits.length - 1) {
          DOM.otpDigits[idx + 1].focus();
        }
      });
      digitInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          DOM.otpDigits[idx - 1].focus();
        }
      });
    });

    // Verify OTP Form
    DOM.verifyOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otpCode = Array.from(DOM.otpDigits).map(d => d.value).join('');
      if (otpCode.length < 6) {
        showToast('Please enter complete 6-digit OTP code', 'warning');
        return;
      }

      try {
        const res = await ApiService.verifyOtp({ email: DOM.otpEmailInput.value.trim(), otp: otpCode });
        showToast(res || 'OTP Verified successfully', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Resend OTP Button
    DOM.resendOtpBtn.addEventListener('click', async () => {
      const email = DOM.otpEmailInput.value.trim();
      if (!email) {
        showToast('Enter your email address first', 'warning');
        return;
      }

      try {
        const res = await ApiService.resendOtp(email);
        showToast(res || 'New OTP sent to email', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });

    // Settings
    DOM.saveSettingsBtn.addEventListener('click', () => {
      state.apiBaseUrl = DOM.apiBaseUrlInput.value.trim();
      localStorage.setItem('ems_api_url', state.apiBaseUrl);
      showToast('API Settings updated', 'success');
      loadData();
    });

    DOM.testConnectionBtn.addEventListener('click', async () => {
      try {
        state.demoMode = false;
        DOM.demoModeToggle.checked = false;
        await ApiService.fetchEmployees();
        showToast('Connected to Spring Boot REST API successfully!', 'success');
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          showToast('Connection failed: ' + err.message, 'danger');
        }
      }
    });

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.closeModal)));
    });
  }

  function switchTab(tabId) {
    state.currentTab = tabId;
    DOM.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    DOM.pages.forEach(page => page.classList.toggle('active', page.id === tabId));

    if (tabId === 'dashboard-tab') {
      DOM.pageTitle.textContent = 'Dashboard Overview';
      DOM.pageSubtitle.textContent = 'Real-time workforce metrics and employee intelligence';
    } else if (tabId === 'employees-tab') {
      DOM.pageTitle.textContent = 'Employee Directory';
      DOM.pageSubtitle.textContent = 'Manage, search, filter, and paginate employee records';
    } else if (tabId === 'auth-tab') {
      DOM.pageTitle.textContent = 'User Registration & OTP Portal';
      DOM.pageSubtitle.textContent = 'Create user accounts, verify access codes, and authenticate with JWT';
    } else if (tabId === 'settings-tab') {
      DOM.pageTitle.textContent = 'API Settings & Security';
      DOM.pageSubtitle.textContent = 'Configure backend endpoint connections and view active JWT tokens';
    }
  }

  function openAddEmployeeModal() {
    DOM.empModalTitle.textContent = 'Add New Employee';
    DOM.empEditOriginalEmail.value = '';
    DOM.empEmailInput.value = '';
    DOM.empEmailInput.disabled = false;
    DOM.empNameInput.value = '';
    DOM.empDeptInput.value = '';
    DOM.empSalaryInput.value = '';
    openModal(DOM.employeeModal);
  }

  function openEditEmployeeModal(email) {
    const emp = state.employees.find(e => e.email === email);
    if (!emp) return;

    DOM.empModalTitle.textContent = 'Edit Employee Record';
    DOM.empEditOriginalEmail.value = emp.email;
    DOM.empEmailInput.value = emp.email;
    DOM.empEmailInput.disabled = true;
    DOM.empNameInput.value = emp.name || '';
    DOM.empDeptInput.value = emp.dept || '';
    DOM.empSalaryInput.value = emp.salary || '';
    openModal(DOM.employeeModal);
  }

  function openDeleteModal(email, name) {
    state.pendingDeleteAll = false;
    state.pendingDeleteEmail = email;
    DOM.deleteModalTitle.textContent = 'Delete Employee?';
    DOM.deleteModalMsg.textContent = `Are you sure you want to delete ${name} (${email})? Requires ADMIN role.`;
    openModal(DOM.deleteModal);
  }

  function openModal(el) { if (el) el.classList.add('active'); }
  function closeModal(el) { if (el) el.classList.remove('active'); }

  function exportToCsv() {
    if (state.employees.length === 0) {
      showToast('No employee records available to export', 'warning');
      return;
    }

    const headers = ['Email', 'Full Name', 'Department', 'Salary'];
    const rows = state.employees.map(e => [
      `"${e.email}"`,
      `"${e.name}"`,
      `"${e.dept}"`,
      e.salary
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EmpSphere_Employees_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employee dataset exported to CSV', 'success');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'ri-information-line';
    if (type === 'success') iconClass = 'ri-checkbox-circle-line';
    if (type === 'danger') iconClass = 'ri-error-warning-line';
    if (type === 'warning') iconClass = 'ri-alert-line';

    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Initialization
  function init() {
    updateUserUI();
    setupEventListeners();
    loadData();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
