(function () {
    const script = document.currentScript || document.getElementById('thrive_script');
    const storeId = script?.getAttribute('data-store-id') || window.thriveWidgetCode;
    const apiUrl = script?.getAttribute('data-api-url') || 'http://localhost:8000';

    if (!storeId) {
        console.error('Loyalty Platform: data-store-id is required');
        return;
    }

    // Persistence: Check localStorage for user identity
    let currentUserId = localStorage.getItem('thrive_user_email') || null;
    let currentUserPhone = localStorage.getItem('thrive_user_phone') || null;
    let currentUserDob = localStorage.getItem('thrive_user_dob') || null;

    // Anonymous Tracking (WebEngage-style LUID)
    // LUID is the stable local user id for this browser/device.
    let luid = localStorage.getItem('thrive_luid');
    if (!luid) {
        luid = 'luid_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('thrive_luid', luid);
    }

    // Source Attribution (First Touch)
    let sourceData = JSON.parse(localStorage.getItem('thrive_source_data') || 'null');
    if (!sourceData) {
        const params = new URLSearchParams(window.location.search);
        sourceData = {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            referrer: document.referrer,
            landing_page: window.location.pathname
        };
        // Only store if we have at least some data
        if (sourceData.utm_source || sourceData.referrer) {
            localStorage.setItem('thrive_source_data', JSON.stringify(sourceData));
        }
    }

    let widgetConfig = null;
    let memberData = null;
    let activeTab = 'dashboard';
    let isLoginMode = false;

    // Expose global API
    window.Thrive = {
        identify: (userData) => {
            if (typeof userData === 'string') {
                currentUserId = userData;
                localStorage.setItem('thrive_user_email', userData);
            } else {
                // Support for various input formats
                const email = userData.email || userData.za_email_id;
                const phone = userData.phone;
                const dob = userData.dob;
                const externalId = userData.user_unique_id;

                if (email) {
                    currentUserId = email;
                    localStorage.setItem('thrive_user_email', email);
                }
                if (phone) {
                    currentUserPhone = phone;
                    localStorage.setItem('thrive_user_phone', phone);
                }
                if (dob) {
                    currentUserDob = dob;
                    localStorage.setItem('thrive_user_dob', dob);
                }
                if (externalId) {
                    localStorage.setItem('thrive_external_id', externalId);
                }
            }
            console.log('Loyalty Platform: Identified user', currentUserId);
            // Link anonymous ID to User ID
            trackEvent('IDENTIFY', userData);
            refreshWidget();
        },
        logout: () => {
            currentUserId = null;
            currentUserPhone = null;
            currentUserDob = null;
            localStorage.removeItem('thrive_user_email');
            localStorage.removeItem('thrive_user_phone');
            localStorage.removeItem('thrive_user_dob');
            // We keep anonymousId to continue tracking as anonymous
            refreshWidget();
        },
        track: async (eventType, data = {}) => {
            return await trackEvent(eventType, data);
        },
        trackPurchase: async (amount, data = {}) => {
            return await trackEvent('PURCHASE', { amount, ...data });
        }
    };

    // Load FingerprintJS (Lazy load)
    let fpPromise = null;
    try {
        fpPromise = import('https://openfpcdn.io/fingerprintjs/v4')
            .then(FingerprintJS => FingerprintJS.load())
            .catch(e => {
                console.warn('Loyalty Platform: FingerprintJS failed to load', e);
                return null;
            });
    } catch (e) {
        console.warn('Loyalty Platform: FingerprintJS import failed', e);
    }

    async function initUser() {
        // Attempt to recover a known user (CUID) for this device using visitor_id + LUID mapping
        if (currentUserId) return;

        let visitorId = null;

        try {
            // Try to get Visitor ID from FingerprintJS
            if (fpPromise) {
                const fp = await fpPromise;
                if (fp) {
                    const result = await fp.get();
                    visitorId = result.visitorId;
                    console.log('Loyalty Platform: Visitor ID (Fingerprint)', visitorId);
                }
            }
        } catch (error) {
            console.warn('Loyalty Platform: FingerprintJS error, falling back to random ID', error);
        }

        // Fallback: Generate Random ID if Fingerprint failed
        if (!visitorId) {
            visitorId = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            console.log('Loyalty Platform: Visitor ID (Random)', visitorId);
        }
        // Persist visitorId so we can attach it to all future events (device identity)
        try {
            localStorage.setItem('thrive_visitor_id', visitorId);
        } catch (e) {
            // ignore
        }

        try {
            const response = await fetch(`${apiUrl}/api/public/init?store_id=${storeId}&visitor_id=${visitorId}&luid=${encodeURIComponent(luid)}`, {
                method: 'POST'
            });
            const apiResult = await response.json();
            if (apiResult.status === 'success') {
                if (apiResult.luid) {
                    luid = apiResult.luid;
                    localStorage.setItem('thrive_luid', luid);
                }
                if (apiResult.user_id) {
                    currentUserId = apiResult.user_id;
                    localStorage.setItem('thrive_user_id', currentUserId);
                    console.log('Loyalty Platform: Recovered Known User', currentUserId);
                } else {
                    console.log('Loyalty Platform: Initialized Anonymous', luid);
                }
            }
        } catch (error) {
            console.error('Loyalty Platform: Failed to init user', error);
        }
    }

    async function trackEvent(type, data = {}) {
        if (!currentUserId) await initUser();

        try {
            const payload = { ...data };
            if (sourceData) payload.source = sourceData;
            payload.url = window.location.href;
            // Attach stable visitor_id for device recognition across sessions
            try {
                payload.visitor_id = localStorage.getItem('thrive_visitor_id') || payload.visitor_id;
            } catch (e) {
                // ignore
            }

            const params = new URLSearchParams({
                store_id: storeId,
                event_type: type,
                user_id: currentUserId || ''
            });

            // Always send anonymous_id so backend can stitch anonymous activity to a real member later.
            // This enables "WebEngage-style" tracking (anonymous browsing -> identify/signup -> merge).
            if (luid) params.append('anonymous_id', luid);

            const response = await fetch(`${apiUrl}/api/public/track?${params}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('Loyalty Platform: Failed to track event', error);
        }
    }

    async function initWidget() {
        await initUser();

        try {
            // Track Page View
            trackEvent('PAGE_VIEW');

            const response = await fetch(`${apiUrl}/api/public/widget-config?store_id=${storeId}`);
            widgetConfig = await response.json();
            // Auto-refresh if user is already logged in
            if (currentUserId || currentUserPhone) {
                refreshWidget();
            } else {
                renderWidget();
            }
        } catch (error) {
            console.error('Loyalty Platform: Failed to load widget config', error);
        }
    }

    async function refreshWidget() {
        if (currentUserId || currentUserPhone) {
            const params = new URLSearchParams({ store_id: storeId });
            if (currentUserId) params.append('email', currentUserId);
            if (currentUserPhone) params.append('phone', currentUserPhone);
            if (currentUserDob) params.append('dob', currentUserDob);

            const response = await fetch(`${apiUrl}/api/public/member-data?${params}`);
            memberData = await response.json();
        } else {
            memberData = null;
        }
        renderWidget();
    }

    function renderWidget() {
        let container = document.getElementById('loyalty-widget-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'loyalty-widget-container';
            container.style.position = 'fixed';
            container.style.bottom = (widgetConfig.bottom_padding || 20) + 'px';
            container.style[widgetConfig.position || 'right'] = (widgetConfig.side_padding || 20) + 'px';
            container.style.zIndex = '9999';
            container.style.fontFamily = 'sans-serif';
            document.body.appendChild(container);
        }

        const launcherColor = widgetConfig.launcher_color || widgetConfig.button_color || '#5c7cfa';
        const panelBgColor = widgetConfig.panel_bg_color || '#ffffff';

        container.innerHTML = `
            <button id="loyalty-toggle-btn" style="width: 60px; height: 60px; border-radius: 50%; background-color: ${launcherColor}; color: white; border: none; boxShadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: auto;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
            <div id="loyalty-panel" style="display: none; position: absolute; bottom: 80px; right: 0; width: 350px; background: ${panelBgColor}; border-radius: 20px; boxShadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden; border: 1px solid #eee;">
                ${renderPanelContent()}
            </div>
        `;

        const toggleBtn = container.querySelector('#loyalty-toggle-btn');
        const panel = container.querySelector('#loyalty-panel');

        toggleBtn.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };

        attachPanelEvents(panel);
    }

    function renderPanelContent() {
        const primaryColor = widgetConfig.primary_color || '#5c7cfa';
        const textColor = widgetConfig.text_color || '#ffffff';
        const buttonColor = widgetConfig.button_color || '#5c7cfa';
        const buttonTextColor = widgetConfig.button_text_color || '#ffffff';
        const panelTextColor = widgetConfig.panel_text_color || '#333333';
        const tabActiveColor = widgetConfig.tab_active_color || primaryColor;
        const tabInactiveColor = widgetConfig.tab_inactive_color || '#999999';

        if (!memberData || !memberData.is_member) {
            if (isLoginMode) {
                return `
                    <div style="background-color: ${primaryColor}; padding: 30px; color: ${textColor};">
                        <p style="margin: 0; font-size: 14px; opacity: 0.8;">${widgetConfig.header_subtitle || 'Welcome to'}</p>
                        <h2 style="margin: 5px 0 0; font-size: 20px; font-weight: bold;">${widgetConfig.header_title || 'Loyalty Program'}</h2>
                    </div>
                    <div style="padding: 30px; text-align: center; color: ${panelTextColor};">
                        <div style="background: #f8f9fa; border-radius: 20px; padding: 20px; border: 1px solid #eee;">
                            <h3 style="margin: 0 0 10px; font-size: 18px; font-weight: bold;">Member Login</h3>
                            <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.8; line-height: 1.5;">Enter your details to access your rewards.</p>
                            
                            <input id="loyalty-email-input" type="email" placeholder="Email Address" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; box-sizing: border-box;">
                            <p style="margin: 10px 0; font-size: 12px; opacity: 0.5;">OR</p>
                            <input id="loyalty-phone-input" type="tel" placeholder="Phone Number" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; box-sizing: border-box;">
                            <input id="loyalty-dob-input" type="date" placeholder="Date of Birth" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 15px; box-sizing: border-box;">
                            
                            <button id="loyalty-login-btn" style="width: 100%; padding: 12px; background-color: ${buttonColor}; color: ${buttonTextColor}; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">Login</button>
                            
                            <p style="margin-top: 15px; font-size: 13px;">New here? <a id="loyalty-toggle-mode" href="#" style="color: ${primaryColor}; font-weight: bold; text-decoration: none;">Join Now</a></p>
                        </div>
                    </div>
                `;
            }

            return `
                <div style="background-color: ${primaryColor}; padding: 30px; color: ${textColor};">
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">${widgetConfig.header_subtitle || 'Welcome to'}</p>
                    <h2 style="margin: 5px 0 0; font-size: 20px; font-weight: bold;">${widgetConfig.header_title || 'Loyalty Program'}</h2>
                </div>
                <div style="padding: 30px; text-align: center; color: ${panelTextColor};">
                    <div style="background: #f8f9fa; border-radius: 20px; padding: 20px; border: 1px solid #eee;">
                        <h3 style="margin: 0 0 10px; font-size: 18px; font-weight: bold;">Become a Member</h3>
                        <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.8; line-height: 1.5;">${widgetConfig.guest_welcome_msg || 'Join our loyalty program to earn points and unlock exclusive rewards.'}</p>
                        
                        <input id="loyalty-email-input" type="email" placeholder="Email Address" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; box-sizing: border-box;">
                        <input id="loyalty-phone-input" type="tel" placeholder="Phone Number" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 10px; box-sizing: border-box;">
                        <input id="loyalty-dob-input" type="date" placeholder="Date of Birth" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 15px; box-sizing: border-box;">
                        
                        <button id="loyalty-join-btn" style="width: 100%; padding: 12px; background-color: ${buttonColor}; color: ${buttonTextColor}; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">${widgetConfig.join_button_text || 'Join Now'}</button>
                        
                        <p style="margin-top: 15px; font-size: 13px;">Already a member? <a id="loyalty-toggle-mode" href="#" style="color: ${primaryColor}; font-weight: bold; text-decoration: none;">Login</a></p>
                    </div>
                </div>
            `;
        }

        return `
            <div style="background-color: ${primaryColor}; padding: 25px; color: ${textColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">${memberData.tier} Member</span>
                    <button id="loyalty-logout-btn" style="background: none; border: none; color: ${textColor}; opacity: 0.6; cursor: pointer; font-size: 12px;">Logout</button>
                </div>
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${memberData.points} Points</h2>
                <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.8;">${widgetConfig.member_welcome_msg || 'Available Balance'}</p>
            </div>
            
            <div style="display: flex; border-bottom: 1px solid #eee;">
                <button class="loyalty-tab-btn" data-tab="dashboard" style="flex: 1; padding: 15px; border: none; background: none; font-size: 13px; font-weight: bold; color: ${activeTab === 'dashboard' ? tabActiveColor : tabInactiveColor}; border-bottom: 2px solid ${activeTab === 'dashboard' ? tabActiveColor : 'transparent'}; cursor: pointer;">Dashboard</button>
                <button class="loyalty-tab-btn" data-tab="earn" style="flex: 1; padding: 15px; border: none; background: none; font-size: 13px; font-weight: bold; color: ${activeTab === 'earn' ? tabActiveColor : tabInactiveColor}; border-bottom: 2px solid ${activeTab === 'earn' ? tabActiveColor : 'transparent'}; cursor: pointer;">Earn</button>
                <button class="loyalty-tab-btn" data-tab="redeem" style="flex: 1; padding: 15px; border: none; background: none; font-size: 13px; font-weight: bold; color: ${activeTab === 'redeem' ? tabActiveColor : tabInactiveColor}; border-bottom: 2px solid ${activeTab === 'redeem' ? tabActiveColor : 'transparent'}; cursor: pointer;">Redeem</button>
            </div>

            <div style="height: 300px; overflow-y: auto; padding: 20px; color: ${panelTextColor};">
                ${renderTabContent()}
            </div>
        `;
    }

    function renderTabContent() {
        if (activeTab === 'dashboard') {
            return `
                <h4 style="margin: 0 0 15px; font-size: 14px; opacity: 0.8;">Recent Activity</h4>
                ${memberData.recent_activity.length > 0 ? memberData.recent_activity.map(a => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5;">
                        <div>
                            <p style="margin: 0; font-size: 13px; font-weight: bold;">${a.reason}</p>
                            <p style="margin: 2px 0 0; font-size: 11px; opacity: 0.6;">${new Date(a.date).toLocaleDateString()}</p>
                        </div>
                        <span style="font-size: 13px; font-weight: bold; color: ${a.amount > 0 ? '#2ecc71' : '#e74c3c'}">${a.amount > 0 ? '+' : ''}${a.amount}</span>
                    </div>
                `).join('') : '<p style="text-align: center; opacity: 0.5; margin-top: 40px;">No activity yet</p>'}
            `;
        }

        if (activeTab === 'earn') {
            return `<div id="loyalty-campaigns-list" style="text-align: center; padding-top: 20px;">Loading campaigns...</div>`;
        }

        if (activeTab === 'redeem') {
            return `<div id="loyalty-rewards-list" style="text-align: center; padding-top: 20px;">Loading rewards...</div>`;
        }
    }

    async function attachPanelEvents(panel) {
        const toggleModeBtn = panel.querySelector('#loyalty-toggle-mode');
        if (toggleModeBtn) {
            toggleModeBtn.onclick = (e) => {
                e.preventDefault();
                isLoginMode = !isLoginMode;
                renderWidget();
            };
        }

        const loginBtn = panel.querySelector('#loyalty-login-btn');
        if (loginBtn) {
            loginBtn.onclick = async () => {
                const email = panel.querySelector('#loyalty-email-input').value;
                const phone = panel.querySelector('#loyalty-phone-input').value;
                const dob = panel.querySelector('#loyalty-dob-input').value;

                if ((email && email.includes('@')) || (phone && dob)) {
                    window.Thrive.identify({ email, phone, dob });
                    // refreshWidget will be called by identify
                } else {
                    alert('Please enter your email or Phone + DOB to login.');
                }
            };
        }

        const joinBtn = panel.querySelector('#loyalty-join-btn');
        if (joinBtn) {
            joinBtn.onclick = async () => {
                const email = panel.querySelector('#loyalty-email-input').value;
                const phone = panel.querySelector('#loyalty-phone-input').value;
                const dob = panel.querySelector('#loyalty-dob-input').value;

                if (email && email.includes('@')) {
                    const result = await trackEvent('SIGNUP', { email, phone, dob });
                    if (result && result.status === 'success') {
                        if (result.points_earned > 0) {
                            alert('Welcome! You just earned points for signing up.');
                        } else {
                            alert('Welcome back! You are already a member.');
                        }
                        window.Thrive.identify({ email, phone, dob });
                    } else {
                        alert('Something went wrong. Please try again.');
                    }
                } else {
                    alert('Please enter a valid email.');
                }
            };
        }

        const logoutBtn = panel.querySelector('#loyalty-logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => window.Thrive.logout();
        }

        const tabBtns = panel.querySelectorAll('.loyalty-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                activeTab = btn.getAttribute('data-tab');
                renderWidget();
                if (activeTab === 'earn') loadCampaigns();
                if (activeTab === 'redeem') loadRewards();
            };
        });
    }

    async function loadCampaigns() {
        // Pass user_id if available to check completion status
        let url = `${apiUrl}/api/public/available-campaigns?store_id=${storeId}`;
        if (currentUserId) {
            // We need the internal user ID, but we only have email/phone in local storage.
            // Ideally memberData has the ID. Let's assume memberData.user_id exists (added in backend update).
            if (memberData && memberData.user_id) {
                url += `&user_id=${memberData.user_id}`;
            }
        }

        const response = await fetch(url);
        const campaigns = await response.json();
        const list = document.getElementById('loyalty-campaigns-list');
        if (list) {
            list.innerHTML = campaigns.map(c => {
                const isCompleted = c.completed || (c.trigger_type === 'SIGNUP' && memberData);
                const btnText = isCompleted ? 'Completed' : 'Go';
                const btnStyle = isCompleted
                    ? 'background: #e6fcf5; color: #0ca678; border: 1px solid #0ca678; cursor: default;'
                    : `background: white; color: ${widgetConfig.primary_color}; border: 1px solid ${widgetConfig.primary_color}; cursor: pointer;`;

                return `
                <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin-bottom: 10px; text-align: left; border: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h5 style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${c.name}</h5>
                        <span style="font-size: 12px; font-weight: bold; color: ${widgetConfig.primary_color};">+${c.points_value}</span>
                    </div>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666;">${c.description}</p>
                    <button class="loyalty-earn-btn" 
                        data-id="${c.id}" 
                        data-type="${c.trigger_type}" 
                        data-completed="${isCompleted}"
                        style="margin-top: 10px; width: 100%; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: bold; ${btnStyle}">
                        ${btnText}
                    </button>
                </div>
            `}).join('');

            // Attach click handlers for campaigns
            list.querySelectorAll('.loyalty-earn-btn').forEach(btn => {
                btn.onclick = async () => {
                    const isCompleted = btn.getAttribute('data-completed') === 'true';
                    if (isCompleted) return;

                    const type = btn.getAttribute('data-type');

                    if (type === 'PURCHASE') {
                        // Redirect to shop
                        window.location.href = '/';
                    } else if (type === 'REVIEW') {
                        window.location.href = '/review';
                    } else {
                        alert('Complete this action to earn points!');
                    }
                };
            });
        }
    }

    async function loadRewards() {
        const response = await fetch(`${apiUrl}/api/public/available-rewards?store_id=${storeId}`);
        const rewards = await response.json();
        const list = document.getElementById('loyalty-rewards-list');
        if (list) {
            list.innerHTML = rewards.map(r => `
                <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin-bottom: 10px; text-align: left; border: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h5 style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">${r.name}</h5>
                        <span style="font-size: 12px; font-weight: bold; color: #e74c3c;">${r.cost} pts</span>
                    </div>
                    <button class="loyalty-redeem-btn" data-id="${r.id}" data-cost="${r.cost}" style="margin-top: 10px; width: 100%; padding: 8px; background: white; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; color: ${memberData.points >= r.cost ? '#333' : '#ccc'}">
                        ${memberData.points >= r.cost ? 'Redeem Now' : 'Not enough points'}
                    </button>
                </div>
            `).join('');

            // Attach click handlers for rewards
            list.querySelectorAll('.loyalty-redeem-btn').forEach(btn => {
                btn.onclick = async () => {
                    const cost = parseInt(btn.getAttribute('data-cost'));
                    const rewardId = btn.getAttribute('data-id');

                    if (memberData.points >= cost) {
                        try {
                            const response = await fetch(`${apiUrl}/api/public/redeem?store_id=${storeId}&reward_id=${rewardId}&user_id=${memberData.user_id}`, {
                                method: 'POST'
                            });
                            const result = await response.json();

                            if (response.ok && result.status === 'success') {
                                alert(`Reward redeemed! Your code is: ${result.redemption_code}`);
                                refreshWidget();
                            } else {
                                alert(result.detail || 'Redemption failed. Please try again.');
                            }
                        } catch (error) {
                            console.error('Redemption error:', error);
                            alert('An error occurred. Please try again.');
                        }
                    } else {
                        alert('You need more points to redeem this reward.');
                    }
                };
            });
        }
    }

    if (document.readyState === 'complete') {
        initWidget();
    } else {
        window.addEventListener('load', initWidget);
    }
})();
