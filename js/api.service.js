const ApiService = {
  async touchUser(userId, displayName) {
    try {
      await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'touchUser', userId, displayName })
      });
    } catch (err) {
      console.error("Touch user error:", err);
    }
  },

  async verifySpecialLogin(userId, password) {
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'verifySpecialLogin', userId, password })
    });
    return await res.json();
  },

  async getBranches() {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getBranches`);
    const json = await res.json();
    return json.status === 'success' ? json.data : [];
  },

  async getBranchesWithOpenTickets() {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getBranchesWithOpenTickets`);
    const json = await res.json();
    return json.status === 'success' ? json.data : [];
  },

  async getRobotsByBranch(branchId) {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getRobotsByBranch&branchId=${branchId}`);
    const json = await res.json();
    return json.status === 'success' ? json.data : [];
  },

  async getOpenTicketsByBranch(branchId) {
    const res = await fetch(`${CONFIG.GAS_URL}?action=getOpenTicketsByBranch&branchId=${branchId}`);
    const json = await res.json();
    return json.status === 'success' ? json.data : [];
  },

  async submitTicket(payload) {
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
};
