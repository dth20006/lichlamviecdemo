const APP_KEY = "cute_dashboard_premium_v2";

function todayKey() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function shortTodayKey() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function createDefaultState() {
  return {
    schedule: [
      ["19/03", "00:00-06:00 Ngủ", "06:00-09:00 Ship", "09:30-11:30 ENT123", "12:00-14:00 Ship", "14:10-16:10 DAT1071", "19:00-22:00 Ship"]
    ],
    checks: {},
    incomes: [],
    expenses: [],
    dailyJournal: {},
    goals: [
      { id: uid(), title: "Laptop mới", amount: 12000000, deadline: "", tier: "S" },
      { id: uid(), title: "Quỹ dự phòng", amount: 3000000, deadline: "", tier: "A" }
    ],
    settings: {
      wageRate: 80000,
      expenseWarn: 200000,
      themeColor: "#ff85b3",
      telegram: {
        enabledTask: true,
        enabledIncome: true,
        enabledExpense: true,
        enabledSchedule: true,
        botToken: "",
        chatId: ""
      },
      warnBefore10: true,
      warnBefore30: false,
      funds: {
        saving: 40,
        fun: 20,
        emergency: 20,
        future: 20
      },
      taskColors: {
        ship: "#89dceb",
        study: "#cba6f7",
        rest: "#f9e2af",
        other: "#ff85b3"
      }
    },
    catProfiles: [
      { key: "idle", label: "😼 Bình tĩnh", desc: "Mèo đang quan sát nhịp làm việc của bạn." },
      { key: "happy", label: "🥳 Hớn hở", desc: "Bạn đang làm rất ổn, mèo ngửi thấy mùi chiến thắng." },
      { key: "strict", label: "😼 Nghiêm khắc", desc: "Vẫn còn nhiều việc, vào guồng lại thôi." },
      { key: "sleepy", label: "😴 Buồn ngủ", desc: "Khuya rồi, nhớ ngủ sớm để mai khỏe." }
    ],
    defaultInsights: [
      "Hôm nay nên ưu tiên task có tiền trước.",
      "Nếu năng lượng dưới 40, nên nghỉ ngắn 15 phút rồi quay lại.",
      "Chi tiêu ăn uống đang tăng, nhớ kiểm soát nhẹ nha."
    ],
    cloud: {
      enabled: false,
      endpoint: ""
    }
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getState() {
  const raw = localStorage.getItem(APP_KEY);
  if (!raw) {
    const init = createDefaultState();
    setState(init);
    return init;
  }
  try {
    const parsed = JSON.parse(raw);
    return mergeState(createDefaultState(), parsed);
  } catch {
    const init = createDefaultState();
    setState(init);
    return init;
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    settings: {
      ...base.settings,
      ...(saved.settings || {}),
      telegram: {
        ...base.settings.telegram,
        ...((saved.settings || {}).telegram || {})
      },
      funds: {
        ...base.settings.funds,
        ...((saved.settings || {}).funds || {})
      },
      taskColors: {
        ...base.settings.taskColors,
        ...((saved.settings || {}).taskColors || {})
      }
    },
    cloud: {
      ...base.cloud,
      ...(saved.cloud || {})
    }
  };
}

function setState(next) {
  localStorage.setItem(APP_KEY, JSON.stringify(next));
}

function updateState(updater) {
  const state = getState();
  const next = updater(structuredClone(state));
  setState(next);
  return next;
}

function getTodaySchedule(state = getState()) {
  return state.schedule.find(d => d[0] === shortTodayKey()) || null;
}

function getTaskType(task) {
  const t = task.toLowerCase();
  if (t.includes("ship")) return "ship";
  if (t.includes("ngủ") || t.includes("ăn")) return "rest";
  if (/[A-Z]{3,4}\d{3,4}/.test(task) || t.includes("meet")) return "study";
  return "other";
}

function parseTaskRange(task) {
  const match = task.match(/(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;
  const h1 = Number(match[1] || 0), m1 = Number(match[2] || 0);
  const h2 = Number(match[3] || 0), m2 = Number(match[4] || 0);
  return { startMinutes: h1 * 60 + m1, endMinutes: h2 * 60 + m2 };
}

function isTaskOverdue(task) {
  const range = parseTaskRange(task);
  if (!range) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur > range.endMinutes;
}

function isTaskDone(dayKey, idx, state = getState()) {
  return !!state.checks[`${dayKey}_${idx}`];
}

function setTaskDone(dayKey, idx, done) {
  return updateState(state => {
    state.checks[`${dayKey}_${idx}`] = done;
    return state;
  });
}

function addExpenseItem(payload) {
  return updateState(state => {
    state.expenses.unshift({
      id: uid(),
      date: todayKey(),
      time: nowTime(),
      reason: payload.reason,
      amount: Number(payload.amount || 0),
      category: payload.category || "other"
    });
    return state;
  });
}

function deleteExpenseItem(id) {
  return updateState(state => {
    state.expenses = state.expenses.filter(e => e.id !== id);
    return state;
  });
}

function addIncomeItem(amount) {
  return updateState(state => {
    state.incomes.unshift({
      id: uid(),
      date: todayKey(),
      time: nowTime(),
      amount: Number(amount || 0)
    });
    return state;
  });
}

function saveDailyJournal(journal) {
  return updateState(state => {
    state.dailyJournal[todayKey()] = {
      mood: journal.mood,
      energy: Number(journal.energy || 0),
      score: Number(journal.score || 0),
      note: journal.note || ""
    };
    return state;
  });
}

function calcStats(state = getState()) {
  const incomeTotal = state.incomes.reduce((s, x) => s + Number(x.amount || 0), 0);
  const expenseTotal = state.expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const net = Math.max(0, incomeTotal - expenseTotal);

  const today = getTodaySchedule(state);
  let totalTasks = 0;
  let doneTasks = 0;
  if (today) {
    totalTasks = Math.max(0, today.length - 1);
    for (let i = 1; i < today.length; i++) {
      if (isTaskDone(today[0], i, state)) doneTasks++;
    }
  }

  const rate = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
  return { incomeTotal, expenseTotal, net, totalTasks, doneTasks, rate };
}

function computeStreak(state = getState()) {
  const keys = Object.keys(state.dailyJournal).sort((a, b) => {
    const pa = a.split("/").reverse().join("-");
    const pb = b.split("/").reverse().join("-");
    return pa.localeCompare(pb);
  });
  let streak = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const j = state.dailyJournal[keys[i]];
    if ((j.score || 0) >= 7) streak++;
    else break;
  }
  return streak;
}

function getCatProfile(state = getState()) {
  const stats = calcStats(state);
  const streak = computeStreak(state);
  const hour = new Date().getHours();
  let key = "idle";

  if (hour >= 23) key = "sleepy";
  else if (stats.rate >= 70 || stats.net >= 300000) key = "happy";
  else if (stats.rate <= 20 && hour >= 14) key = "strict";

  const found = state.catProfiles.find(x => x.key === key) || state.catProfiles[0];
  const level = Math.max(1, Math.floor((stats.doneTasks + streak * 2) / 3) + 1);
  const rank = level >= 15 ? "Diamond" : level >= 10 ? "Gold" : level >= 5 ? "Silver" : "Bronze";
  return { ...found, level, rank, streak };
}

function buildBadges(state = getState()) {
  const stats = calcStats(state);
  const streak = computeStreak(state);
  return [
    { title: "🔥 Streak Starter", unlocked: streak >= 3 },
    { title: "💰 First Money", unlocked: stats.incomeTotal >= 50000 },
    { title: "✅ Task Hunter", unlocked: stats.doneTasks >= 5 },
    { title: "🐖 Saver", unlocked: stats.net >= 500000 },
    { title: "🧠 Stable Mind", unlocked: Object.keys(state.dailyJournal).length >= 5 }
  ];
}

async function sendTelegramMessage(text, type) {
  const state = getState();
  const tg = state.settings.telegram;
  const enabledMap = {
    task: tg.enabledTask,
    income: tg.enabledIncome,
    expense: tg.enabledExpense,
    schedule: tg.enabledSchedule
  };
  if (!enabledMap[type]) return;
  if (!tg.botToken || !tg.chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${tg.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: tg.chatId,
        text
      })
    });
  } catch (e) {
    console.log("Telegram error:", e);
  }
}

function exportJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsvFile(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
