const state = getState();
let chartRefs = {};

function formatMoney(v) {
  return Number(v || 0).toLocaleString("vi-VN") + "đ";
}

function renderMoodCat() {
  const cat = getCatProfile();
  document.getElementById("catMoodLabel").textContent = cat.label;
  document.getElementById("catMoodDesc").textContent = cat.desc;
  document.getElementById("catLevel").textContent = cat.level;
  document.getElementById("catRank").textContent = cat.rank;
  document.getElementById("catStreak").textContent = `${cat.streak} ngày`;

  document.getElementById("widgetMood").textContent = cat.label;
}

function renderJournal() {
  const journal = getState().dailyJournal[todayKey()] || {};
  const mood = document.getElementById("journalMood");
  const energy = document.getElementById("journalEnergy");
  const score = document.getElementById("journalScore");
  const note = document.getElementById("journalNote");
  mood.value = journal.mood || "normal";
  energy.value = journal.energy ?? 50;
  score.value = journal.score ?? "";
  note.value = journal.note || "";
  document.getElementById("energyValue").textContent = energy.value;
}

function renderTodaySchedule() {
  const state = getState();
  const wrap = document.getElementById("todayScheduleList");
  const day = getTodaySchedule(state);

  const search = document.getElementById("taskSearch").value.trim().toLowerCase();
  const filter = document.getElementById("taskFilter").value;

  if (!day) {
    wrap.innerHTML = `<div class="list-item">Hôm nay chưa có lịch.</div>`;
    return;
  }

  const rows = day.slice(1).map((task, idx) => {
    const realIdx = idx + 1;
    const type = getTaskType(task);
    const done = isTaskDone(day[0], realIdx, state);
    const overdue = isTaskOverdue(task);

    return { task, idx: realIdx, type, done, overdue };
  }).filter(item => {
    const searchOk = !search || item.task.toLowerCase().includes(search);
    let filterOk = true;
    if (filter === "done") filterOk = item.done;
    else if (filter === "todo") filterOk = !item.done;
    else if (filter === "overdue") filterOk = item.overdue && !item.done;
    else if (["ship","study","rest"].includes(filter)) filterOk = item.type === filter;
    return searchOk && filterOk;
  });

  wrap.innerHTML = rows.map(item => {
    const color = state.settings.taskColors[item.type] || state.settings.taskColors.other;
    return `
      <div class="task-item">
        <div class="task-left">
          <input type="checkbox" ${item.done ? "checked" : ""} data-day="${day[0]}" data-idx="${item.idx}" class="taskCheck">
          <div>
            <div style="font-weight:700">${item.task}</div>
            <div class="task-meta">
              <span class="tag" style="background:${color}22;color:${color}">${item.type}</span>
              ${item.overdue ? `<span class="tag">quá giờ</span>` : ``}
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn ghost markTaskBtn" data-day="${day[0]}" data-idx="${item.idx}">
            ${item.done ? "Bỏ xong" : "Hoàn thành"}
          </button>
        </div>
      </div>
    `;
  }).join("") || `<div class="list-item">Không có task phù hợp bộ lọc.</div>`;

  wrap.querySelectorAll(".taskCheck,.markTaskBtn").forEach(el => {
    el.addEventListener("click", async (e) => {
      const dayKey = el.dataset.day;
      const idx = el.dataset.idx;
      const current = isTaskDone(dayKey, idx);
      setTaskDone(dayKey, idx, !current);
      if (!current) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
        await sendTelegramMessage(`✅ Task xong: ${dayKey} - #${idx}`, "task");
      }
      rerenderAll();
    });
  });
}

function renderExpenses() {
  const state = getState();
  const wrap = document.getElementById("expenseList");
  const filter = document.getElementById("expenseFilterCategory").value;
  const sort = document.getElementById("expenseSort").value;

  let items = [...state.expenses];
  if (filter !== "all") items = items.filter(x => x.category === filter);

  if (sort === "newest") items.sort((a,b) => (b.date + b.time).localeCompare(a.date + a.time));
  if (sort === "oldest") items.sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (sort === "high") items.sort((a,b) => b.amount - a.amount);
  if (sort === "low") items.sort((a,b) => a.amount - b.amount);

  wrap.innerHTML = items.map(item => `
    <div class="list-item">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <div style="font-weight:700">${item.reason}</div>
          <div class="task-meta">${item.date} • ${item.time} • ${item.category}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <b style="color:var(--pink)">-${formatMoney(item.amount)}</b>
          <button class="btn ghost delExpenseBtn" data-id="${item.id}">Xóa</button>
        </div>
      </div>
    </div>
  `).join("") || `<div class="list-item">Chưa có chi tiêu.</div>`;

  wrap.querySelectorAll(".delExpenseBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteExpenseItem(btn.dataset.id);
      rerenderAll();
    });
  });
}

function renderFunds() {
  const state = getState();
  const stats = calcStats(state);
  const p = state.settings.funds;

  document.getElementById("totalAccumulated").textContent = formatMoney(stats.net);
  document.getElementById("fundSaving").textContent = formatMoney(stats.net * p.saving / 100);
  document.getElementById("fundEmergency").textContent = formatMoney(stats.net * p.emergency / 100);
  document.getElementById("fundFuture").textContent = formatMoney(stats.net * p.future / 100);

  const incomeWrap = document.getElementById("incomeHistory");
  incomeWrap.innerHTML = state.incomes.map(x => `
    <div class="list-item">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div style="font-weight:700">${x.date}</div>
          <div class="task-meta">${x.time}</div>
        </div>
        <b style="color:var(--green)">+${formatMoney(x.amount)}</b>
      </div>
    </div>
  `).join("") || `<div class="list-item">Chưa có lịch sử thu nhập.</div>`;
}

function renderGoals() {
  const state = getState();
  const stats = calcStats(state);
  const wrap = document.getElementById("goalStack");

  wrap.innerHTML = state.goals.map(goal => {
    const percent = Math.max(0, Math.min(100, Math.round(stats.net / goal.amount * 100)));
    return `
      <div class="goal-card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <div>
            <div style="font-weight:800">${goal.title}</div>
            <div class="task-meta">Tier ${goal.tier} ${goal.deadline ? "• " + goal.deadline : ""}</div>
          </div>
          <span class="tag">${percent}%</span>
        </div>
        <div class="progress"><div class="fill" style="width:${percent}%"></div></div>
        <div class="task-meta" style="margin-top:8px">${formatMoney(stats.net)} / ${formatMoney(goal.amount)}</div>
      </div>
    `;
  }).join("") || `<div class="list-item">Chưa có mục tiêu.</div>`;
}

function renderMetrics() {
  const state = getState();
  const stats = calcStats(state);
  const todayJournal = state.dailyJournal[todayKey()] || {};
  const metricGrid = document.getElementById("metricGrid");

  const avgExpense = state.expenses.length
    ? Math.round(state.expenses.reduce((s,x)=>s+x.amount,0) / state.expenses.length)
    : 0;

  const metrics = [
    ["Thu nhập", formatMoney(stats.incomeTotal)],
    ["Chi tiêu", formatMoney(stats.expenseTotal)],
    ["Tích lũy", formatMoney(stats.net)],
    ["Task done", `${stats.doneTasks}/${stats.totalTasks}`],
    ["Điểm ngày", `${todayJournal.score ?? 0}/10`]
  ];

  metricGrid.innerHTML = metrics.map(([label, value]) => `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-sub">${label === "Chi tiêu" ? "TB: " + formatMoney(avgExpense) : "Cập nhật realtime"}</div>
    </div>
  `).join("");

  const insights = [...state.defaultInsights];
  if (stats.expenseTotal > state.settings.expenseWarn) insights.unshift("⚠️ Chi tiêu đã vượt ngưỡng cảnh báo hôm nay.");
  if (stats.rate < 40) insights.unshift("🎯 Tỷ lệ hoàn thành task còn thấp, nên xử lý các task ngắn trước.");
  if ((todayJournal.energy ?? 50) < 40) insights.unshift("🔋 Năng lượng thấp, nên nghỉ ngắn trước khi làm task khó.");

  document.getElementById("insightList").innerHTML = insights.map(text => `
    <div class="list-item">${text}</div>
  `).join("");
}

function renderBadges() {
  const badges = buildBadges();
  const wrap = document.getElementById("badgeList");
  wrap.innerHTML = badges.map(b => `
    <div class="badge-card">
      <div style="font-weight:800">${b.title}</div>
      <div class="task-meta">${b.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}</div>
    </div>
  `).join("");

  const streak = computeStreak();
  document.getElementById("streakSummary").textContent = `Bạn đang có streak ${streak} ngày với các ngày đạt từ 7/10 trở lên.`;
}

function renderWidget() {
  const state = getState();
  const stats = calcStats(state);
  const day = getTodaySchedule(state);
  let workedHours = 0;

  if (day) {
    for (let i = 1; i < day.length; i++) {
      if (isTaskDone(day[0], i, state)) {
        const range = parseTaskRange(day[i]);
        if (range) workedHours += (range.endMinutes - range.startMinutes) / 60;
      }
    }
  }

  document.getElementById("widgetWorked").textContent = workedHours.toFixed(1) + "h";
  document.getElementById("widgetIncome").textContent = formatMoney(stats.incomeTotal);
  document.getElementById("widgetDoneRate").textContent = stats.rate + "%";
}

function destroyCharts() {
  Object.values(chartRefs).forEach(chart => chart?.destroy?.());
  chartRefs = {};
}

function renderCharts() {
  destroyCharts();
  const state = getState();
  const stats = calcStats(state);

  const incomeByDate = {};
  state.incomes.forEach(x => incomeByDate[x.date] = (incomeByDate[x.date] || 0) + x.amount);

  const expenseByDate = {};
  state.expenses.forEach(x => expenseByDate[x.date] = (expenseByDate[x.date] || 0) + x.amount);

  const dates = [...new Set([...Object.keys(incomeByDate), ...Object.keys(expenseByDate)])].sort((a,b) => {
    const pa = a.split("/").reverse().join("-");
    const pb = b.split("/").reverse().join("-");
    return pa.localeCompare(pb);
  });

  let running = 0;
  const accumSeries = dates.map(d => {
    running += (incomeByDate[d] || 0) - (expenseByDate[d] || 0);
    return Math.max(0, running);
  });

  const categoryMap = {};
  state.expenses.forEach(x => categoryMap[x.category] = (categoryMap[x.category] || 0) + x.amount);

  chartRefs.income = new Chart(document.getElementById("incomeChart"), {
    type: "bar",
    data: { labels: dates, datasets: [{ label: "Thu nhập", data: dates.map(d => incomeByDate[d] || 0) }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  chartRefs.expense = new Chart(document.getElementById("expenseChart"), {
    type: "bar",
    data: { labels: dates, datasets: [{ label: "Chi tiêu", data: dates.map(d => expenseByDate[d] || 0) }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  chartRefs.accum = new Chart(document.getElementById("accumChart"), {
    type: "line",
    data: { labels: dates, datasets: [{ label: "Tích lũy", data: accumSeries }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  chartRefs.category = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{ label: "Category", data: Object.values(categoryMap) }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  chartRefs.task = new Chart(document.getElementById("taskChart"), {
    type: "pie",
    data: {
      labels: ["Hoàn thành", "Chưa hoàn thành"],
      datasets: [{ data: [stats.doneTasks, Math.max(0, stats.totalTasks - stats.doneTasks)] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function rerenderAll() {
  renderMoodCat();
  renderJournal();
  renderTodaySchedule();
  renderExpenses();
  renderFunds();
  renderGoals();
  renderMetrics();
  renderBadges();
  renderWidget();
  renderCharts();
}

function bindEvents() {
  document.getElementById("journalEnergy").addEventListener("input", e => {
    document.getElementById("energyValue").textContent = e.target.value;
  });

  document.getElementById("saveJournalBtn").addEventListener("click", () => {
    saveDailyJournal({
      mood: document.getElementById("journalMood").value,
      energy: document.getElementById("journalEnergy").value,
      score: document.getElementById("journalScore").value,
      note: document.getElementById("journalNote").value
    });
    rerenderAll();
  });

  document.getElementById("taskSearch").addEventListener("input", renderTodaySchedule);
  document.getElementById("taskFilter").addEventListener("change", renderTodaySchedule);

  document.getElementById("completeOverdueBtn").addEventListener("click", async () => {
    const state = getState();
    const today = getTodaySchedule(state);
    if (!today) return;

    for (let i = 1; i < today.length; i++) {
      if (isTaskOverdue(today[i]) && !isTaskDone(today[0], i, state)) {
        setTaskDone(today[0], i, true);
      }
    }
    await sendTelegramMessage("⏰ Đã tự hoàn thành các task quá giờ.", "schedule");
    rerenderAll();
  });

  document.getElementById("addExpenseBtn").addEventListener("click", async () => {
    const reason = document.getElementById("expenseReason").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value || 0);
    const category = document.getElementById("expenseCategory").value;

    if (!reason || amount <= 0) return;

    addExpenseItem({ reason, amount, category });
    document.getElementById("expenseReason").value = "";
    document.getElementById("expenseAmount").value = "";
    await sendTelegramMessage(`💸 Chi tiêu: ${reason} - ${amount}`, "expense");
    rerenderAll();
  });

  document.getElementById("expenseFilterCategory").addEventListener("change", renderExpenses);
  document.getElementById("expenseSort").addEventListener("change", renderExpenses);

  document.getElementById("quickIncomeOpenBtn").addEventListener("click", () => {
    document.getElementById("incomeModalOverlay").style.display = "flex";
  });
  document.getElementById("closeIncomeModalBtn").addEventListener("click", () => {
    document.getElementById("incomeModalOverlay").style.display = "none";
  });
  document.getElementById("saveQuickIncomeBtn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("quickIncomeAmount").value || 0);
    if (amount <= 0) return;
    addIncomeItem(amount);
    document.getElementById("quickIncomeAmount").value = "";
    document.getElementById("incomeModalOverlay").style.display = "none";
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.65 } });
    await sendTelegramMessage(`💰 Thu nhập mới: ${amount}`, "income");
    rerenderAll();
  });

  document.getElementById("closeWidgetBtn").addEventListener("click", () => {
    document.getElementById("catWidget").style.display = "none";
  });
}

bindEvents();
rerenderAll();
