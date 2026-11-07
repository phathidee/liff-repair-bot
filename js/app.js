let currentMode = 'open';
let branchesData = [];
let robotsData = [];
let openTicketsData = [];
let branchesWithOpenTickets = [];

window.onload = function() {
  AuthModule.initLiff(() => {
    AppModule.loadBranchSuggestions();
  });
};

const AppModule = {
  // ⚡ ฟังก์ชันสำหรับจัดการปุ่ม "ออก / ปิด" (รองรับทั้งมือถือและทุก Browser บนคอมพิวเตอร์)
  closeAppWindow() {
    if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) {
      // 1. ถ้าเปิดในแอป LINE บนมือถือ -> สั่งปิดหน้าต่าง LIFF เด้งกลับเข้าแชท LINE ทันที
      liff.closeWindow();
    } else {
      // 2. ถ้าเปิดบนคอมพิวเตอร์ (ทุก Browser) -> เนื่องจาก Browser บล็อก window.close() 
      // ระบบจะถามยืนยันและพาเปลี่ยนเส้นทางไปหน้าแรกหรือหน้า LINE แทน
      const confirmLeave = confirm("ต้องการออกจากระบบ / ปิดหน้านี้ใช่หรือไม่?");
      if (confirmLeave) {
        window.location.href = "https://line.me/"; 
      }
    }
  },

  async loadBranchSuggestions() {
    AppModule.showLoading(true);
    branchesData = await ApiService.getBranches();
    AppModule.showLoading(false);
    
    const datalist = document.getElementById('branch-list');
    datalist.innerHTML = '';
    branchesData.forEach(b => {
      const opt = document.createElement('option');
      opt.value = `${b.branchId} - ${b.branchName}`;
      datalist.appendChild(opt);
    });
  },

  async loadBranchesWithOpenTickets() {
    AppModule.showLoading(true);
    branchesWithOpenTickets = await ApiService.getBranchesWithOpenTickets();
    AppModule.showLoading(false);

    let totalOpenCount = branchesWithOpenTickets.reduce((sum, b) => sum + b.count, 0);
    const badge = document.getElementById('open-tickets-count-badge');
    const select = document.getElementById('branch-select');
    
    select.innerHTML = '<option value="">-- กรุณาเลือกสาขาที่มีเคสค้าง --</option>';

    if (totalOpenCount > 0) {
      badge.innerText = `⚠️ มีเคสค้างทั้งหมด ${totalOpenCount} เคส ในระบบ (${branchesWithOpenTickets.length} สาขา)`;
      badge.style.display = 'block';

      branchesWithOpenTickets.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.branchId;
        opt.innerText = `${b.branchId} - ${b.branchName} (ค้าง ${b.count} เคส)`;
        select.appendChild(opt);
      });
    } else {
      badge.innerText = `✅ ไม่มีเคสค้างในระบบขณะนี้`;
      badge.style.backgroundColor = '#d1fae5';
      badge.style.color = '#065f46';
      badge.style.display = 'block';

      const opt = document.createElement('option');
      opt.value = "";
      opt.innerText = "-- ไม่มีเคสค้างในระบบ --";
      select.appendChild(opt);
    }
  },

  async onBranchSelected() {
    const val = document.getElementById('branch-input').value;
    const branchId = val.split(' - ')[0].trim();
    if (!branchId) return;

    AppModule.showLoading(true);
    robotsData = await ApiService.getRobotsByBranch(branchId);
    AppModule.showLoading(false);

    const robotSelect = document.getElementById('robot-sn');
    robotSelect.innerHTML = '<option value="">-- เลือก SN หุ่นยนต์ --</option>';
    robotsData.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.robotSN;
      opt.innerText = `${r.robotSN} (${r.robotModel})`;
      robotSelect.appendChild(opt);
    });
  },

  async onBranchDropdownSelected() {
    const branchId = document.getElementById('branch-select').value;
    if (!branchId) return;

    AppModule.showLoading(true);
    openTicketsData = await ApiService.getOpenTicketsByBranch(branchId);
    AppModule.showLoading(false);

    const ticketSelect = document.getElementById('open-tickets');
    ticketSelect.innerHTML = '<option value="">-- เลือกรายการเคสค้าง --</option>';
    
    openTicketsData.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.rowIndex;
      opt.innerText = `[${t.robotSN}] ${t.category} (แจ้งโดย: ${t.openedBy})`;
      ticketSelect.appendChild(opt);
    });
  },

  setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('repair-form').reset();

    if (mode === 'open') {
      document.querySelectorAll('.tab-btn')[0].classList.add('active');
      document.getElementById('branch-input-group').style.display = 'block';
      document.getElementById('branch-select-group').style.display = 'none';
      document.getElementById('robot-sn-group').style.display = 'block';
      document.getElementById('open-tickets-group').style.display = 'none';
      document.getElementById('issue-type-group').style.display = 'block';
      document.getElementById('detail-label').innerText = 'รายละเอียดอาการเบื้องต้น:';
      document.getElementById('submit-btn').innerText = 'ยืนยันการเปิดเคส';
      document.getElementById('open-tickets-count-badge').style.display = 'none';
      AppModule.loadBranchSuggestions();
    } else {
      document.querySelectorAll('.tab-btn')[1].classList.add('active');
      document.getElementById('branch-input-group').style.display = 'none';
      document.getElementById('branch-select-group').style.display = 'block';
      document.getElementById('robot-sn-group').style.display = 'none';
      document.getElementById('open-tickets-group').style.display = 'block';
      document.getElementById('issue-type-group').style.display = 'none';
      document.getElementById('detail-label').innerText = 'บันทึกการแก้ไข / หมายเหตุปิดเคส:';
      document.getElementById('submit-btn').innerText = 'ยืนยันการปิดเคส';
      AppModule.loadBranchesWithOpenTickets();
    }
  },

  async submitForm() {
    let branchId = '';
    let branchName = '';
    const detail = document.getElementById('issue-detail').value;

    if (currentMode === 'open') {
      const branchVal = document.getElementById('branch-input').value;
      branchId = branchVal.split(' - ')[0].trim();
      branchName = branchVal.split(' - ')[1] || branchId;
    } else {
      const select = document.getElementById('branch-select');
      branchId = select.value;
      branchName = select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : branchId;
    }

    if (!branchId || !detail) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = 'กำลังส่งข้อมูล...';

    let payload = {
      action: currentMode === 'open' ? 'createTicket' : 'closeTicket',
      branchId: branchId,
      branchName: branchName,
      userId: userProfile.userId,
      displayName: userProfile.displayName
    };

    if (currentMode === 'open') {
      const robotSN = document.getElementById('robot-sn').value;
      if (!robotSN) { 
        alert('กรุณาเลือก SN หุ่นยนต์'); 
        btn.disabled = false; 
        btn.innerText = 'ยืนยันการเปิดเคส'; 
        return; 
      }
      
      const selectedRobot = robotsData.find(r => r.robotSN === robotSN) || {};
      payload.robotSN = robotSN;
      payload.issueType = document.getElementById('issue-type').value;
      payload.issueDetail = detail;
      payload.vendorName = selectedRobot.vendorName || '';
      payload.jobType = "ซ่อม";
    } else {
      const rowIndex = document.getElementById('open-tickets').value;
      if (!rowIndex) { 
        alert('กรุณาเลือกเคสที่ต้องการปิด'); 
        btn.disabled = false; 
        btn.innerText = 'ยืนยันการปิดเคส'; 
        return; 
      }
      const selectedTicket = openTicketsData.find(t => t.rowIndex == rowIndex) || {};
      payload.rowIndex = rowIndex;
      payload.robotSN = selectedTicket.robotSN;
      payload.resolution = detail;
    }

    try {
      const res = await ApiService.submitTicket(payload);
      alert(res.message);
      btn.disabled = false;
      btn.innerText = currentMode === 'open' ? 'ยืนยันการเปิดเคส' : 'ยืนยันการปิดเคส';
      
      // บันทึกสำเร็จแล้ว สั่งปิดหน้าต่างอัตโนมัติ
      AppModule.closeAppWindow();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      btn.disabled = false;
      btn.innerText = currentMode === 'open' ? 'ยืนยันการเปิดเคส' : 'ยืนยันการปิดเคส';
    }
  },

  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
  }
};
