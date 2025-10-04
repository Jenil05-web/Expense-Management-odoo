// Main JavaScript file for Expense Management System

document.addEventListener('DOMContentLoaded', function() {
    
    // =============================================
    // Sidebar Toggle Functionality
    // =============================================
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Restore sidebar state from localStorage
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar?.classList.add('collapsed');
    }
    
    // =============================================
    // Dropdown Functionality
    // =============================================
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('show');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('show');
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
    
    // =============================================
    // Global Search Functionality
    // =============================================
    const globalSearch = document.getElementById('globalSearch');
    
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // =============================================
    // Alert Auto Dismiss
    // =============================================
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        if (!alert.classList.contains('alert-dismissible')) {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
    });
    
    // =============================================
    // Form Validation Helper
    // =============================================
    window.validateForm = function(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    };
    
    // =============================================
    // Number Formatting
    // =============================================
    window.formatCurrency = function(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };
    
    window.formatNumber = function(number) {
        return new Intl.NumberFormat('en-US').format(number);
    };
    
    // =============================================
    // Date Formatting
    // =============================================
    window.formatDate = function(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    
    window.formatDateTime = function(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };
    
    // =============================================
    // Show/Hide Loading Overlay
    // =============================================
    window.showLoading = function() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    };
    
    window.hideLoading = function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    };
    
    // =============================================
    // Confirmation Dialog
    // =============================================
    window.confirmAction = function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    };
    
    // =============================================
    // Toast Notification
    // =============================================
    window.showToast = function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
    
    // =============================================
    // Copy to Clipboard
    // =============================================
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    };
    
    // =============================================
    // Initialize Tooltips (if using Bootstrap)
    // =============================================
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    if (typeof bootstrap !== 'undefined') {
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // =============================================
    // AJAX Helper
    // =============================================
    window.ajaxRequest = async function(url, method = 'GET', data = null) {
        try {
            showLoading();
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            const result = await response.json();
            
            hideLoading();
            
            if (!response.ok) {
                throw new Error(result.message || 'Request failed');
            }
            
            return result;
        } catch (error) {
            hideLoading();
            showToast(error.message, 'error');
            throw error;
        }
    };
    
    // =============================================
    // Form Submit with AJAX
    // =============================================
    window.submitFormAjax = function(formId, successCallback) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            try {
                const result = await ajaxRequest(form.action, form.method, data);
                if (successCallback) {
                    successCallback(result);
                }
            } catch (error) {
                console.error('Form submission error:', error);
            }
        });
    };
    
    // =============================================
    // Table Sorting
    // =============================================
    window.initTableSort = function(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const headers = table.querySelectorAll('th[data-sort]');
        
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                const column = this.dataset.sort;
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                const isAscending = this.classList.contains('sort-asc');
                
                // Remove sort classes from all headers
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                
                // Add appropriate class
                this.classList.add(isAscending ? 'sort-desc' : 'sort-asc');
                
                rows.sort((a, b) => {
                    const aValue = a.querySelector(`td[data-sort="${column}"]`)?.textContent || '';
                    const bValue = b.querySelector(`td[data-sort="${column}"]`)?.textContent || '';
                    
                    if (isAscending) {
                        return bValue.localeCompare(aValue);
                    } else {
                        return aValue.localeCompare(bValue);
                    }
                });
                
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    };
    
    // =============================================
    // Debounce Function
    // =============================================
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // =============================================
    // Initialize all interactive elements
    // =============================================
    initializeInteractiveElements();
});

// =============================================
// Initialize Interactive Elements
// =============================================
function initializeInteractiveElements() {
    // File input preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const preview = document.getElementById(this.dataset.preview);
                if (preview) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">`;
                        };
                        reader.readAsDataURL(file);
                    } else {
                        preview.innerHTML = `<p>File selected: ${file.name}</p>`;
                    }
                }
            }
        });
    });
    
    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea[data-auto-resize]');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
    
    // Number input validation
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });
}

// =============================================
// Export functions for use in other scripts
// =============================================
window.EMS = {
    validateForm: window.validateForm,
    formatCurrency: window.formatCurrency,
    formatNumber: window.formatNumber,
    formatDate: window.formatDate,
    formatDateTime: window.formatDateTime,
    showLoading: window.showLoading,
    hideLoading: window.hideLoading,
    confirmAction: window.confirmAction,
    showToast: window.showToast,
    copyToClipboard: window.copyToClipboard,
    ajaxRequest: window.ajaxRequest,
    submitFormAjax: window.submitFormAjax,
    initTableSort: window.initTableSort,
    debounce: window.debounce
};