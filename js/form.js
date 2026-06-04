/* ============================================
   PRAJAPATI ELECTRICAL — Contact Form Handler
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const formContent = document.getElementById('form-content');
  const formSuccess = document.getElementById('form-success');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const name = form.querySelector('#form-name').value.trim();
    const phone = form.querySelector('#form-phone').value.trim();
    const service = form.querySelector('#form-service').value;
    const message = form.querySelector('#form-message').value.trim();

    if (!name || !phone || !service) {
      showToast('कृपया सभी आवश्यक फ़ील्ड भरें / Please fill all required fields', 'error');
      return;
    }

    // Phone validation (Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[\s\-\+91]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      showToast('कृपया सही मोबाइल नंबर दर्ज करें / Please enter a valid phone number', 'error');
      return;
    }

    // Submit to FormSubmit
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    fetch("https://formsubmit.co/ajax/prajapatielectrical01@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        name: name,
        phone: phone,
        service: service,
        message: message || "No message",
        _cc: "vkpn2006@gmail.com",
        _subject: `New Service Inquiry: ${service} from ${name}`,
        _captcha: "false"
      })
    })
    .then(response => {
      if (response.ok) {
        // Show success message
        formContent.style.display = 'none';
        formSuccess.classList.add('show');

        // Build WhatsApp message with form data
        const waMessage = `🔧 *New Inquiry - Prajapati Electrical*%0A%0A` +
          `👤 *Name:* ${name}%0A` +
          `📱 *Phone:* ${phone}%0A` +
          `🔧 *Service:* ${service}%0A` +
          `💬 *Message:* ${message || 'No message'}`;

        // Open WhatsApp with the form data
        const waLink = document.getElementById('wa-form-link');
        if (waLink) {
          waLink.href = `https://wa.me/917250191427?text=${waMessage}`;
        }

        // Reset form
        form.reset();

        // Reset success message after 10 seconds
        setTimeout(() => {
          formContent.style.display = 'block';
          formSuccess.classList.remove('show');
        }, 10000);
      } else {
        showToast('कुछ गलत हुआ। कृपया पुनः प्रयास करें। / Something went wrong. Please try again.', 'error');
      }
    })
    .catch(error => {
      console.error(error);
      showToast('कुछ गलत हुआ। कृपया पुनः प्रयास करें। / Something went wrong. Please try again.', 'error');
    })
    .finally(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    });
  });

  // Toast notification
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    `;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: type === 'error' ? '#EF4444' : '#22C55E',
      color: '#fff',
      padding: '14px 24px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.9rem',
      fontFamily: "'Inter', sans-serif",
      zIndex: '10000',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'all 0.4s ease'
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
});
