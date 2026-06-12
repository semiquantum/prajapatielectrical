/* ============================================
   PRAJAPATI ELECTRICAL — Google Analytics 4
   ============================================ */

/**
 * Initialize Google Analytics (GA4) with a specific tracking ID.
 * The script dynamically injects the Google Tag Manager script into the head.
 */
(function initAnalytics() {
  // GA4 Measurement ID (mock or environment variable)
  const GA_TRACKING_ID = window.ENV?.GA_TRACKING_ID || 'G-XXXXXXXXXX';
  
  if (GA_TRACKING_ID && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
    // Inject the script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize the data layer
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());

    gtag('config', GA_TRACKING_ID, {
      cookie_domain: 'auto',
      cookie_flags: 'SameSite=None;Secure'
    });

    console.log(`Analytics initialized for ${GA_TRACKING_ID}`);
  } else {
    console.log('Analytics not initialized: Missing or placeholder Tracking ID.');
    
    // Provide a mock gtag function for development
    window.gtag = function() {
        console.log('Mock Analytics Event:', arguments);
    };
  }
})();
