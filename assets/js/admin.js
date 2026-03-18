function setStatus(text) {
  document.getElementById("adminStatus").textContent = text;
}

function renderDaySelect() {
  const state = getState();
  const select = document.getElementById("daySelect");
  select.innerHTML = state.schedule.map((d, i) => `<option value="${i}">${d[0]}</option>`).join("");
  if (state.schedule.length) loadDayEditor();
}

function loadDayEditor() {
  const state = getState();
  const idx = Number(document.getElementById("daySelect").value || 0);
  const day = state.schedule[idx];
  if (!day) {
    document.getElementById("dayTasksEditor").value = "";
    return;
  }
  document.getElementById("dayTasksEditor").value = day.slice(1).join("\n");
}

function parseDateKey(dateObj) {
  return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
}

function buildStudyDaySchedule(date, classList) {
  const tasks = [date, "00:00-06:00 Ngủ", "06:00-09:00 Ship", "11:30-12:00 Ăn trưa", "12:00-13:30 Ship", ...classList, "16:30-20:00 Ship", "20:00-20:30 Ăn tối", "21:00-23:30 Ship"];
  const header = tasks.shift();
  const sorted = tasks.sort();
  return [header, ...sorted];
}

function buildFreeDaySchedule(date) {
  return [date, "00:00-06:00 Ngủ", "06:00-11:30 Ship", "11:30-12:00 Ăn trưa", "12:00-20:00 Ship", "20:00-20:30 Ăn tối", "20:30-23:59 Ship"];
}

function processTKB() {
  const raw = document.getElementById("tkbInput").value.trim();
  if (!raw) return;

  const lines = raw.split("\n").filter(Boolean);
  const classesByDate = {};
  let minDate = null;
  let maxDate = null;

  lines.forEach(line => {
    const dm = line.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dm) return;

    const d = new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]));
    const dateKey = parseDateKey(d);

    if (!minDate || d < minDate) minDate = new Date(d);
    if (!maxDate || d > maxDate) maxDate = new Date(d);

    if (line.includes("DAT103") || line.includes("VIE111") || line.includes("Giáo dục thể chất")) return;

    const subjectMatch = line.match(/[A-Z]{3,4}\d{3,4}/);
    const subject = subjectMatch ? subjectMatch[0] : "Học tập";

    const isOnline = /Google Meet|Học Online|Meet/i.test(line);
    let timeStr = "14:10-16:10";

    if (!isOnline) {
      const tm = line.match(/(\d{2}:\d{2}):\d{2}\s*-\s*(\d{2}:\d{2}):\d{2}/);
      if (tm) timeStr = `${tm[1]}-${tm[2]}`;
    }

    if (!classesByDate[dateKey]) classesByDate[dateKey] = [];
    classesByDate[dateKey].push(`${timeStr} ${subject}`);
  });

  if (!minDate || !maxDate) return;

  updateState(state => {
    state.schedule = [];
    const cursor = new Date(minDate);
    while (cursor <= maxDate) {
      const dk = parseDateKey(cursor);
      const classList = classesByDate[dk] || [];
      state.schedule.push(classList.length ? buildStudyDaySchedule(dk, classList.sort()) : buildFreeDaySchedule(dk));
      cursor.setDate(cursor.getDate() + 1);
    }
    return state;
  });

  renderDaySelect();
  setStatus("✅ Đã process TKB thành công.");
}

function renderGoalsAdmin() {
  const state = getState();
  const wrap = document.getElementById("adminGoalList");
  wrap.innerHTML = state.goals.map(goal => `
    <div class="list-item">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <div style="font-weight:700">${goal.title}</div>
          <div class="task-meta">${goal.tier} • ${goal.deadline || "Không deadline"} • ${Number(goal.amount).toLocaleString("vi-VN")}đ</div>
        </div>
        <button class="btn danger delGoalBtn" data-id="${goal.id}">Xóa</button>
      </div>
    </div>
  `).join("") || `<div class="list-item">Chưa có goal.</div>`;

  wrap.querySelectorAll(".delGoalBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      updateState(state => {
        state.goals = state.goals.filter(g => g.id !== btn.dataset.id);
        return state;
      });
      renderGoalsAdmin();
    });
  });
}

function loadSettingsToForm() {
  const state = getState();
  const s = state.settings;

  document.getElementById("wageRateInput").value = s.wageRate;
  document.getElementById("expenseWarnInput").value = s.expenseWarn;
  document.getElementById("themeColorInput").value = s.themeColor;

  document.getElementById("telegramBotTokenInput").value = s.telegram.botToken || "";
  document.getElementById("telegramChatIdInput").value = s.telegram.chatId || "";

  document.getElementById("notifyTaskToggle").checked = s.telegram.enabledTask;
  document.getElementById("notifyIncomeToggle").checked = s.telegram.enabledIncome;
  document.getElementById("notifyExpenseToggle").checked = s.telegram.enabledExpense;
  document.getElementById("notifyScheduleToggle").checked = s.telegram.enabledSchedule;

  document.getElementById("warn10Toggle").checked = s.warnBefore10;
  document.getElementById("warn30Toggle").checked = s.warnBefore30;

  document.getElementById("fundSavingPercent").value = s.funds.saving;
  document.getElementById("fundFunPercent").value = s.funds.fun;
  document.getElementById("fundEmergencyPercent").value = s.funds.emergency;
  document.getElementById("fundFuturePercent").value = s.funds.future;

  document.getElementById("taskColorShip").value = s.taskColors.ship;
  document.getElementById("taskColorStudy").value = s.taskColors.study;
  document.getElementById("taskColorRest").value = s.taskColors.rest;
  document.getElementById("taskColorOther").value = s.taskColors.other;

  document.getElementById("catMoodEditor").value = state.catProfiles.map(x => `${x.key}|${x.label}|${x.desc}`).join("\n");
  document.getElementById("insightEditor").value = state.defaultInsights.join("\n");
}

function bindAdminEvents() {
  document.getElementById("processTKBBtn").addEventListener("click", processTKB);
  document.getElementById("daySelect").addEventListener("change", loadDayEditor);

  document.getElementById("saveDayBtn").addEventListener("click", () => {
    const idx = Number(document.getElementById("daySelect").value || 0);
    const tasks = document.getElementById("dayTasksEditor").value.split("\n").map(x => x.trim()).filter(Boolean);
    updateState(state => {
      if (!state.schedule[idx]) return state;
      state.schedule[idx] = [state.schedule[idx][0], ...tasks];
      return state;
    });
    setStatus("💾 Đã lưu day editor.");
  });

  document.getElementById("deleteDayBtn").addEventListener("click", () => {
    const idx = Number(document.getElementById("daySelect").value || 0);
    updateState(state => {
      state.schedule.splice(idx, 1);
      return state;
    });
    renderDaySelect();
    setStatus("🗑️ Đã xóa ngày.");
  });

  document.getElementById("addGoalBtn").addEventListener("click", () => {
    const title = document.getElementById("goalTitle").value.trim();
    const amount = Number(document.getElementById("goalAmount").value || 0);
    const deadline = document.getElementById("goalDeadline").value;
    const tier = document.getElementById("goalTier").value;
    if (!title || amount <= 0) return;

    updateState(state => {
      state.goals.unshift({ id: uid(), title, amount, deadline, tier });
      return state;
    });

    document.getElementById("goalTitle").value = "";
    document.getElementById("goalAmount").value = "";
    document.getElementById("goalDeadline").value = "";
    renderGoalsAdmin();
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    updateState(state => {
      state.settings.wageRate = Number(document.getElementById("wageRateInput").value || 80000);
      state.settings.expenseWarn = Number(document.getElementById("expenseWarnInput").value || 200000);
      state.settings.themeColor = document.getElementById("themeColorInput").value || "#ff85b3";

      state.settings.telegram.botToken = document.getElementById("telegramBotTokenInput").value.trim();
      state.settings.telegram.chatId = document.getElementById("telegramChatIdInput").value.trim();

      state.settings.telegram.enabledTask = document.getElementById("notifyTaskToggle").checked;
      state.settings.telegram.enabledIncome = document.getElementById("notifyIncomeToggle").checked;
      state.settings.telegram.enabledExpense = document.getElementById("notifyExpenseToggle").checked;
      state.settings.telegram.enabledSchedule = document.getElementById("notifyScheduleToggle").checked;

      state.settings.warnBefore10 = document.getElementById("warn10Toggle").checked;
      state.settings.warnBefore30 = document.getElementById("warn30Toggle").checked;

      state.settings.funds.saving = Number(document.getElementById("fundSavingPercent").value || 0);
      state.settings.funds.fun = Number(document.getElementById("fundFunPercent").value || 0);
      state.settings.funds.emergency = Number(document.getElementById("fundEmergencyPercent").value || 0);
      state.settings.funds.future = Number(document.getElementById("fundFuturePercent").value || 0);

      return state;
    });
    setStatus("🛠️ Đã lưu settings.");
  });

  document.getElementById("saveTaskColorsBtn").addEventListener("click", () => {
    updateState(state => {
      state.settings.taskColors.ship = document.getElementById("taskColorShip").value;
      state.settings.taskColors.study = document.getElementById("taskColorStudy").value;
      state.settings.taskColors.rest = document.getElementById("taskColorRest").value;
      state.settings.taskColors.other = document.getElementById("taskColorOther").value;
      return state;
    });
    setStatus("🎨 Đã lưu màu task.");
  });

  document.getElementById("saveCatInsightBtn").addEventListener("click", () => {
    const moods = document.getElementById("catMoodEditor").value.split("\n").map(x => x.trim()).filter(Boolean).map(line => {
      const [key, label, desc] = line.split("|");
      return { key: key?.trim(), label: label?.trim(), desc: desc?.trim() };
    }).filter(x => x.key && x.label && x.desc);

    const insights = document.getElementById("insightEditor").value.split("\n").map(x => x.trim()).filter(Boolean);

    updateState(state => {
      state.catProfiles = moods.length ? moods : state.catProfiles;
      state.defaultInsights = insights.length ? insights : state.defaultInsights;
      return state;
    });
    setStatus("😼 Đã lưu Cat & Insight.");
  });

  document.getElementById("exportJsonBtn").addEventListener("click", () => {
    exportJsonFile("dashboard-backup.json", getState());
  });

  document.getElementById("importJsonInput").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      setState(mergeState(createDefaultState(), parsed));
      renderDaySelect();
      renderGoalsAdmin();
      loadSettingsToForm();
      setStatus("📥 Import JSON thành công.");
    } catch {
      setStatus("❌ File JSON không hợp lệ.");
    }
  });

  document.getElementById("exportExpenseCsvBtn").addEventListener("click", () => {
    const rows = [["date","time","reason","amount","category"], ...getState().expenses.map(x => [x.date, x.time, x.reason, x.amount, x.category])];
    exportCsvFile("expenses.csv", rows);
  });

  document.getElementById("exportIncomeCsvBtn").addEventListener("click", () => {
    const rows = [["date","time","amount"], ...getState().incomes.map(x => [x.date, x.time, x.amount])];
    exportCsvFile("incomes.csv", rows);
  });

  document.getElementById("loadCloudScheduleBtn").addEventListener("click", () => {
    setStatus("☁️ Bản này đang để local-first. Bước sau tôi có thể cắm Firestore cho bạn.");
  });

  document.getElementById("syncCloudScheduleBtn").addEventListener("click", () => {
    setStatus("🚀 Bản này đã sẵn cấu trúc settings/cloud, có thể cắm Firestore ở bước tiếp.");
  });

  document.getElementById("loadGoalCloudBtn").addEventListener("click", () => {
    setStatus("☁️ Goal cloud placeholder.");
  });

  document.getElementById("saveGoalCloudBtn").addEventListener("click", () => {
    setStatus("☁️ Goal sync placeholder.");
  });
}

bindAdminEvents();
renderDaySelect();
renderGoalsAdmin();
loadSettingsToForm();
