const STORAGE_KEY = "song-night-tour-beta";

const defaultState = {
  auth: {
    isLoggedIn: false,
    phone: "",
    codeRequested: false,
    verificationCode: "",
  },
  profileToken: {
    code: "",
    rank: "宣和夜游使",
    name: "游人 · 汴京访客",
  },
  pointsLedger: {
    balance: 2860,
    entries: [
      { label: "入园点灯礼", amount: "+120" },
      { label: "菊街茶饮消费", amount: "+80" },
      { label: "鹤台光影互动", amount: "+160" },
    ],
  },
  guide: {
    currentIndex: 0,
    isPlaying: false,
    progress: 0,
    items: [
      {
        title: "《鹤影临菊台》",
        copy: "宫灯初上，菊影映水，鹤群自云间徐徐回旋。",
      },
      {
        title: "《宣和夜市卷》",
        copy: "沿长街缓行，听乐声、茶烟与摊影在夜色中交汇。",
      },
      {
        title: "《月下观演录》",
        copy: "主秀将启，银波与鹤羽在水幕上渐次展开。",
      },
    ],
  },
  mapExperience: {
    activePoint: 0,
    points: [
      {
        title: "入园门楼",
        copy: "当前推荐从门楼入场，沿菊影灯阵前往主秀区。",
      },
      {
        title: "菊影长街",
        copy: "此处适合夜拍与小吃互动，可累计节庆消费积分。",
      },
      {
        title: "瑞鹤观演台",
        copy: "主舞台与 AR 观演点位，建议提前 10 分钟入场。",
      },
    ],
  },
  cameraExperience: {
    mode: "checkin",
    scene: "crane",
    isFullscreen: false,
    lastRewardedAt: 0,
    cameraOpened: false,
  },
};

let appState = loadState();
let toastTimer = null;
let guideTimer = null;
let mediaStream = null;

const loginScreen = document.getElementById("login-screen");
const homeScreen = document.getElementById("home-screen");
const phoneInput = document.getElementById("phone-input");
const codeInput = document.getElementById("code-input");
const sendCodeBtn = document.getElementById("send-code-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const tokenCode = document.getElementById("token-code");
const tokenRank = document.getElementById("token-rank");
const tokenName = document.getElementById("token-name");
const pointsValue = document.getElementById("points-value");
const pointsList = document.getElementById("points-list");

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const featurePanels = {
  guide: document.getElementById("panel-guide"),
  map: document.getElementById("panel-map"),
  camera: document.getElementById("panel-camera"),
};

const guideTitle = document.getElementById("guide-title");
const guideCopy = document.getElementById("guide-copy");
const guideProgress = document.getElementById("guide-progress");
const guideStatus = document.getElementById("guide-status");
const guidePlayBtn = document.getElementById("guide-play-btn");
const guideList = document.getElementById("guide-list");

const mapTitle = document.getElementById("map-title");
const mapCopy = document.getElementById("map-copy");
const mapPoints = Array.from(document.querySelectorAll(".map-point"));

const cameraFullscreen = document.getElementById("camera-fullscreen");
const cameraModeTitle = document.getElementById("camera-mode-title");
const cameraFullCopy = document.getElementById("camera-full-copy");
const cameraTip = document.getElementById("camera-tip");
const openCameraBtn = document.getElementById("open-camera-btn");
const closeCameraBtn = document.getElementById("close-camera-btn");
const checkinBtn = document.getElementById("checkin-btn");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
const sceneButtons = Array.from(document.querySelectorAll(".scene-btn"));
const arSceneSwitch = document.getElementById("ar-scene-switch");

const previewVideo = document.getElementById("camera-video");
const fullscreenVideo = document.getElementById("camera-video-full");
const previewFallback = document.getElementById("camera-fallback");
const fullscreenFallback = document.getElementById("camera-fallback-full");
const previewOverlay = document.getElementById("ar-overlay");
const fullscreenOverlay = document.getElementById("ar-overlay-full");

const toast = document.getElementById("toast");
const rewardModal = document.getElementById("reward-modal");
const rewardCopy = document.getElementById("reward-copy");
const rewardCloseBtn = document.getElementById("reward-close-btn");

render();
bindEvents();

function bindEvents() {
  sendCodeBtn.addEventListener("click", handleSendCode);
  loginBtn.addEventListener("click", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  guidePlayBtn.addEventListener("click", toggleGuidePlayback);
  openCameraBtn.addEventListener("click", openFullscreenCamera);
  closeCameraBtn.addEventListener("click", closeFullscreenCamera);
  checkinBtn.addEventListener("click", handleCameraAction);
  rewardCloseBtn.addEventListener("click", () => rewardModal.classList.add("hidden"));

  navButtons.forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panel));
  });

  mapPoints.forEach((button) => {
    button.addEventListener("click", () => setMapPoint(Number(button.dataset.point)));
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setCameraMode(button.dataset.mode));
  });

  sceneButtons.forEach((button) => {
    button.addEventListener("click", () => setArScene(button.dataset.scene));
  });
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return initializeState();
    }
    return mergeState(initializeState(), JSON.parse(saved));
  } catch (error) {
    return initializeState();
  }
}

function initializeState() {
  return {
    ...cloneDefaultState(),
    profileToken: {
      ...defaultState.profileToken,
      code: createTokenCode(),
    },
  };
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function mergeState(base, incoming) {
  return {
    ...base,
    ...incoming,
    auth: { ...base.auth, ...(incoming.auth || {}) },
    profileToken: { ...base.profileToken, ...(incoming.profileToken || {}) },
    pointsLedger: { ...base.pointsLedger, ...(incoming.pointsLedger || {}) },
    guide: {
      ...base.guide,
      ...(incoming.guide || {}),
      items: incoming.guide?.items || base.guide.items,
    },
    mapExperience: {
      ...base.mapExperience,
      ...(incoming.mapExperience || {}),
      points: incoming.mapExperience?.points || base.mapExperience.points,
    },
    cameraExperience: { ...base.cameraExperience, ...(incoming.cameraExperience || {}) },
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function render() {
  renderAuth();
  renderProfile();
  renderGuide(appState.guide);
  renderMap(appState.mapExperience);
  renderCamera(appState.cameraExperience);
}

function renderAuth() {
  loginScreen.classList.toggle("hidden", appState.auth.isLoggedIn);
  homeScreen.classList.toggle("hidden", !appState.auth.isLoggedIn);
  phoneInput.value = appState.auth.phone;
  codeInput.value = "";
}

function renderProfile() {
  tokenCode.textContent = appState.profileToken.code;
  tokenRank.textContent = appState.profileToken.rank;
  tokenName.textContent = appState.profileToken.name;
  pointsValue.textContent = appState.pointsLedger.balance;
  pointsList.innerHTML = appState.pointsLedger.entries
    .slice(0, 4)
    .map((entry) => `<li><span>${entry.label}</span><strong>${entry.amount}</strong></li>`)
    .join("");
}

function renderGuide(guide) {
  const current = guide.items[guide.currentIndex];
  guideTitle.textContent = current.title;
  guideCopy.textContent = current.copy;
  guideProgress.style.width = `${guide.progress}%`;
  guideStatus.textContent = guide.isPlaying
    ? `播放中 ${Math.round(guide.progress)}%`
    : guide.progress > 0
      ? `已暂停 ${Math.round(guide.progress)}%`
      : "未播放";
  guidePlayBtn.textContent = guide.isPlaying ? "暂停聆听" : guide.progress > 0 ? "继续聆听" : "开始聆听";

  guideList.innerHTML = guide.items
    .map(
      (item, index) => `
        <button class="guide-item ${index === guide.currentIndex ? "active" : ""}" data-guide-index="${index}" type="button">
          <strong>${item.title}</strong>
          <p>${item.copy}</p>
        </button>
      `
    )
    .join("");

  Array.from(guideList.querySelectorAll(".guide-item")).forEach((button) => {
    button.addEventListener("click", () => selectGuide(Number(button.dataset.guideIndex)));
  });
}

function renderMap(mapExperience) {
  const current = mapExperience.points[mapExperience.activePoint];
  mapTitle.textContent = current.title;
  mapCopy.textContent = current.copy;

  mapPoints.forEach((point, index) => {
    point.classList.toggle("active", index === mapExperience.activePoint);
  });
}

function renderCamera(cameraExperience) {
  const isAr = cameraExperience.mode === "ar";

  cameraFullscreen.classList.toggle("hidden", !cameraExperience.isFullscreen);
  document.body.style.overflow = cameraExperience.isFullscreen ? "hidden" : "";

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === cameraExperience.mode);
  });

  sceneButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scene === cameraExperience.scene);
  });

  previewOverlay.classList.toggle("hidden", !isAr);
  fullscreenOverlay.classList.toggle("hidden", !isAr);
  arSceneSwitch.classList.toggle("hidden", !isAr);

  cameraModeTitle.textContent = isAr ? "AR 演绎" : "打卡识别";
  cameraTip.textContent = isAr
    ? "进入全屏后可在底部切换“瑞鹤巡游”和“菊影流光”两种 AR 内容。"
    : "进入全屏后可用更大的取景窗口完成打卡识别。";
  cameraFullCopy.textContent = isAr
    ? "请选择下方 AR 内容，在全屏夜景中观看演绎效果。"
    : "请将打卡点置于取景框中央，准备开始识别。";
  checkinBtn.textContent = isAr ? "触发 AR 效果" : "识别打卡点";

  syncArSceneLayers(cameraExperience.scene);
  syncCameraView(mediaStream !== null);
}

function handleSendCode() {
  const phone = phoneInput.value.trim();
  if (!/^1\d{10}$/.test(phone)) {
    showToast("请输入正确的 11 位手机号");
    return;
  }

  appState.auth.phone = phone;
  appState.auth.codeRequested = true;
  appState.auth.verificationCode = String(Math.floor(1000 + Math.random() * 9000));
  saveState();
  showToast(`验证码已送达：${appState.auth.verificationCode}`);
}

function handleLogin() {
  const phone = phoneInput.value.trim();
  const code = codeInput.value.trim();

  if (!/^1\d{10}$/.test(phone)) {
    showToast("手机号格式不正确");
    return;
  }

  if (!appState.auth.codeRequested) {
    showToast("请先获取验证码");
    return;
  }

  if (!code) {
    showToast("请输入验证码");
    return;
  }

  if (code !== appState.auth.verificationCode) {
    showToast("验证码不匹配，请输入刚刚收到的 4 位数字");
    return;
  }

  appState.auth.isLoggedIn = true;
  appState.auth.phone = phone;
  saveState();
  render();
  showToast("身份令已生效，欢迎入园");
}

function handleLogout() {
  stopGuidePlayback();
  stopCameraStream();
  appState = initializeState();
  saveState();
  render();
  showToast("已退出夜游身份");
}

function switchPanel(panel) {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panel);
  });

  Object.entries(featurePanels).forEach(([key, node]) => {
    node.classList.toggle("hidden", key !== panel);
  });
}

function selectGuide(index) {
  appState.guide.currentIndex = index;
  appState.guide.progress = 0;
  appState.guide.isPlaying = false;
  stopGuidePlayback();
  saveState();
  renderGuide(appState.guide);
}

function toggleGuidePlayback() {
  if (appState.guide.isPlaying) {
    appState.guide.isPlaying = false;
    stopGuidePlayback();
    saveState();
    renderGuide(appState.guide);
    return;
  }

  appState.guide.isPlaying = true;
  guideTimer = window.setInterval(() => {
    appState.guide.progress += 4;
    if (appState.guide.progress >= 100) {
      appState.guide.progress = 100;
      appState.guide.isPlaying = false;
      stopGuidePlayback();
    }
    saveState();
    renderGuide(appState.guide);
  }, 600);
  saveState();
  renderGuide(appState.guide);
}

function stopGuidePlayback() {
  if (guideTimer) {
    window.clearInterval(guideTimer);
    guideTimer = null;
  }
}

function setMapPoint(index) {
  appState.mapExperience.activePoint = index;
  saveState();
  renderMap(appState.mapExperience);
}

function setCameraMode(mode) {
  appState.cameraExperience.mode = mode;
  saveState();
  renderCamera(appState.cameraExperience);
}

function setArScene(scene) {
  appState.cameraExperience.scene = scene;
  saveState();
  renderCamera(appState.cameraExperience);
}

async function openFullscreenCamera() {
  appState.cameraExperience.isFullscreen = true;
  saveState();
  renderCamera(appState.cameraExperience);
  await startCameraStream();
}

function closeFullscreenCamera() {
  appState.cameraExperience.isFullscreen = false;
  saveState();
  renderCamera(appState.cameraExperience);
}

async function startCameraStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("当前环境不支持摄像头，已使用演示模式");
    return;
  }

  if (mediaStream) {
    syncCameraView(true);
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    previewVideo.srcObject = mediaStream;
    fullscreenVideo.srcObject = mediaStream;
    appState.cameraExperience.cameraOpened = true;
    saveState();
    syncCameraView(true);
    showToast("摄像头已开启");
  } catch (error) {
    syncCameraView(false);
    showToast("摄像头未授权，继续使用演示模式");
  }
}

function stopCameraStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  previewVideo.srcObject = null;
  fullscreenVideo.srcObject = null;
  syncCameraView(false);
}

function syncCameraView(hasStream) {
  previewVideo.classList.toggle("hidden", !hasStream);
  fullscreenVideo.classList.toggle("hidden", !hasStream);
  previewFallback.classList.toggle("hidden", hasStream);
  fullscreenFallback.classList.toggle("hidden", hasStream);
}

function syncArSceneLayers(scene) {
  const layers = Array.from(document.querySelectorAll(".ar-layer"));
  layers.forEach((layer) => {
    layer.classList.toggle("hidden", layer.dataset.arScene !== scene);
  });
}

function handleCameraAction() {
  if (appState.cameraExperience.mode === "ar") {
    const sceneLabel = appState.cameraExperience.scene === "crane" ? "瑞鹤巡游" : "菊影流光";
    showToast(`${sceneLabel} 已在全屏中显现`);
    return;
  }

  const now = Date.now();
  if (now - appState.cameraExperience.lastRewardedAt < 3000) {
    showToast("已完成本次识别，请稍后再试");
    return;
  }

  appState.cameraExperience.lastRewardedAt = now;
  appState.pointsLedger.balance += 120;
  appState.pointsLedger.entries.unshift({
    label: "瑞鹤打卡识别",
    amount: "+120",
  });
  rewardCopy.textContent = "银票积分 +120，两盏菊灯已为你点亮。";
  rewardModal.classList.remove("hidden");
  saveState();
  renderProfile();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function createTokenCode() {
  const segment = Math.random().toString(36).slice(2, 6).toUpperCase();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `RUIHE-${segment}-${suffix}`;
}
