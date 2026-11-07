let userProfile = { userId: "LINE_USER", displayName: "LINE User" };
let activeRole = null;

const AuthModule = {
  initLiff(onReady) {
    liff.init({ liffId: CONFIG.LIFF_ID }).then(() => {
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        liff.getProfile().then(profile => {
          userProfile = profile;
          document.getElementById('user-display-name').innerText = profile.displayName;
          ApiService.touchUser(profile.userId, profile.displayName);
          if (onReady) onReady(profile);
        });
      }
    }).catch(err => console.error('LIFF Init Error:', err));
  },

  openSpecialLoginModal() {
    document.getElementById('special-password').value = '';
    document.getElementById('special-login-modal').style.display = 'flex';
  },

  closeSpecialLoginModal() {
    document.getElementById('special-login-modal').style.display = 'none';
  },

  bypassRoleLogin(roleName) {
    alert(`🧪 [Bypass Mode] ทดลองเข้าใช้งานในสิทธิ์: ${roleName}`);
    activeRole = roleName;
    AuthModule.closeSpecialLoginModal();
    AuthModule.renderSpecialDashboard(roleName);
  },

  async submitSpecialLogin() {
    const password = document.getElementById('special-password').value;
    if (password) {
      alert('🧪 [Bypass Mode] ผ่านรหัสผ่านชั่วคราวสำเร็จ! เข้าสู่สิทธิ์ AdminIT');
      activeRole = 'AdminIT';
      AuthModule.closeSpecialLoginModal();
      AuthModule.renderSpecialDashboard('AdminIT');
      return;
    }

    AppModule.showLoading(true);
    try {
      const res = await ApiService.verifySpecialLogin(userProfile.userId, password);
      AppModule.showLoading(false);
      if (res.status === 'success') {
        alert('🎉 ' + res.message + '\nRole: ' + res.role);
        activeRole = res.role;
        AuthModule.closeSpecialLoginModal();
        AuthModule.renderSpecialDashboard(res.role);
      } else {
        alert(res.message);
        if (res.message.includes('ไม่มีสิทธิ์')) AuthModule.closeSpecialLoginModal();
      }
    } catch (err) {
      AppModule.showLoading(false);
      alert('⚠️ เชื่อมต่อไม่ได้ เข้าสู่ Bypass AdminIT ให้ชั่วคราวครับ');
      activeRole = 'AdminIT';
      AuthModule.closeSpecialLoginModal();
      AuthModule.renderSpecialDashboard('AdminIT');
    }
  },

  renderSpecialDashboard(role) {
    const container = document.getElementById('dashboard-buttons-container');
    const badge = document.getElementById('current-role-badge');
    const dashboardSection = document.getElementById('special-dashboard-section');
    
    badge.innerText = `Role: ${role}`;
    container.innerHTML = '';

    const allMenuButtons = [
      { id: 'btn-user-mgr', label: '👥 จัดการผู้ใช้ (Special_Users)', roles: ['AdminIT'] },
      { id: 'btn-sys-config', label: '⚙️ ตั้งค่าระบบ/สาขา', roles: ['AdminIT', 'Admin'] },
      { id: 'btn-tech-job', label: '🛠️ รายการรับงานซ่อม (Technician)', roles: ['AdminIT', 'Technician'] },
      { id: 'btn-parts-order', label: '📦 เบิก/อนุมัติอะไหล่', roles: ['AdminIT', 'Admin', 'Technician'] },
      { id: 'btn-vendor-claim', label: '🏭 จัดการส่งซ่อม Vendor', roles: ['AdminIT', 'Vendor'] },
      { id: 'btn-report-export', label: '📊 ดึงรายงาน Excel/Summary', roles: ['AdminIT', 'Admin'] }
    ];

    allMenuButtons.forEach(btn => {
      const buttonElem = document.createElement('div');
      buttonElem.className = 'dash-btn';
      buttonElem.innerText = btn.label;

      const hasAccess = btn.roles.includes(role);
      if (hasAccess) {
        buttonElem.onclick = () => alert(`คลิกเปิดเมนู: ${btn.label}`);
      } else {
        buttonElem.classList.add('disabled-role-btn');
        buttonElem.innerText += ' 🔒';
        buttonElem.onclick = () => alert(`⚠️ เฉพาะสิทธิ์ [${btn.roles.join(', ')}] เท่านั้นที่ใช้เมนูนี้ได้`);
      }
      container.appendChild(buttonElem);
    });

    dashboardSection.style.display = 'block';
    dashboardSection.scrollIntoView({ behavior: 'smooth' });
  },

  logoutSpecialMode() {
    activeRole = null;
    document.getElementById('special-dashboard-section').style.display = 'none';
    alert('ออกจากโหมดพิเศษเรียบร้อยแล้ว');
  }
};
