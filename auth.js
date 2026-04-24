const API = "https://aura-cafe-full-stack-webapp-production.up.railway.app";

// Handle password visibility toggle
const togglePasswordBtn = document.getElementById('togglePassword');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        const eyeIcon = document.getElementById('eyeIcon');
        
        let type = passwordInput.type === 'password' ? 'text' : 'password';
        
        passwordInput.type = type;
        if (confirmPasswordInput) {
            confirmPasswordInput.type = type;
        }
        
        if (type === 'text') {
            eyeIcon.setAttribute('data-lucide', 'eye-off');
        } else {
            eyeIcon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });
}

// Show error message
function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

// Hide error message
function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.add('hidden');
}

// Handle Form Submission logic
async function handleAuth(event, type) {
    event.preventDefault();
    hideError();

    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const originalText = type === 'login' ? 'Sign In' : 'Create Account';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    let payload = { email, password };

    if (type === 'signup') {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const confirmPassword = document.getElementById('confirm_password').value.trim();
        
        if (password !== confirmPassword) {
            showError("Passwords do not match");
            return;
        }
        
        payload = { name, email, phone, password };
    }

    // UI Loading State
    btnText.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...`;
    document.getElementById('btnIcon').classList.add('hidden');
    submitBtn.disabled = true;
    lucide.createIcons();

    try {
        const endpoint = type === 'login' ? '/login' : '/signup';
        const url = `${API}${endpoint}`;
        console.log("API Call:", url);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Save details to localStorage
            if (data.token) {
                localStorage.setItem('jwtToken', data.token);
            }
            if (type === 'signup') {
                localStorage.setItem('userName', payload.name);
                localStorage.setItem('userEmail', payload.email);
                localStorage.setItem('userPhone', payload.phone);
            } else if (type === 'login' && data.user) {
                // Assuming backend returns user details on login
                if(data.user.name) localStorage.setItem('userName', data.user.name);
                if(data.user.phone) localStorage.setItem('userPhone', data.user.phone);
                localStorage.setItem('userEmail', email);
            } else {
                localStorage.setItem('userEmail', email);
                // Also setting placeholder name/phone if not returned, just to have something for checkout
                if(!localStorage.getItem('userName')) localStorage.setItem('userName', 'Customer');
                if(!localStorage.getItem('userPhone')) localStorage.setItem('userPhone', 'Not provided');
            }
            
            // Redirect smoothly
            submitBtn.classList.remove('bg-cafe-800');
            submitBtn.classList.add('bg-green-600');
            btnText.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i> Success! Redirecting...`;
            lucide.createIcons();
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            showError(data.detail || data.message || (type === 'login' ? 'Invalid credentials' : 'Signup failed'));
            resetButton(btnText, submitBtn, originalText);
        }
    } catch (error) {
        showError('Network error. Please make sure the backend is running.');
        resetButton(btnText, submitBtn, originalText);
    }
}

function resetButton(btnText, submitBtn, originalText) {
    btnText.textContent = originalText;
    document.getElementById('btnIcon').classList.remove('hidden');
    submitBtn.disabled = false;
    lucide.createIcons();
}
