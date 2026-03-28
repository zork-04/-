const STORAGE_KEY = "song-night-tour-beta";

const chrysanthemumOptions = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  image: `./tex/${index + 1}.png`,
  name: `花信${toChineseNumber(index + 1)}`,
  code: `菊印编号 ${String(index + 1).padStart(2, "0")}`,
}));

const arConfig = {
  anchors: [
    {
      id: "gate",
      title: "门楼海报",
      subtitle: "高对比导览牌",
      scene: "crane",
      guidance: "请将入园门楼的瑞鹤导览牌置于取景框中央。",
      story: "瑞鹤初现，夜巡之门已经开启。",
      rewardTitle: "已收录门楼瑞鹤",
      rewardCopy: "银票积分 +120，夜游剧情《门楼启宴》已解锁。",
      points: 120,
    },
    {
      id: "street",
      title: "菊街灯牌",
      subtitle: "节庆灯箱装置",
      scene: "chrysanthemum",
      guidance: "请对准菊影长街的灯箱牌面，等待花影锁定。",
      story: "菊影流光漫过长街，节庆氛围渐次铺展。",
      rewardTitle: "已收录菊街花影",
      rewardCopy: "银票积分 +160，夜游剧情《长街流光》已解锁。",
      points: 160,
    },
    {
      id: "stage",
      title: "观演台装置",
      subtitle: "主秀识别图",
      scene: "crane",
      guidance: "请将瑞鹤观演台的主秀识别图完整放入画面。",
      story: "瑞鹤与菊影在高台叠映，高潮篇章已经点亮。",
      rewardTitle: "已收录高台华章",
      rewardCopy: "银票积分 +220，夜游剧情《高台叠影》已解锁。",
      points: 220,
    },
  ],
};

const defaultState = {
  auth: {
    isLoggedIn: false,
    pendingIdentitySelection: false,
    phone: "",
    codeRequested: false,
    verificationCode: "",
  },
  chrysanthemumIdentity: {
    selectedChrysanthemumId: null,
    selectedChrysanthemumImage: "",
    selectedChrysanthemumName: "",
    identityMark: "夜游花印",
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
    completedChapterIndexes: [],
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
  arAvailability: {
    environment: "待检测",
    cameraSupported: false,
    recognitionMode: "demo",
    status: "checking",
    message: "正在检测运行环境。",
  },
  arRecognition: {
    isRecognizing: false,
    recognizedAnchorId: null,
    activeAnchorId: null,
    stability: 0,
    failureReason: "",
  },
  arExperience: {
    currentAnchorId: null,
    currentScene: "crane",
    isPlaying: false,
    isCompleted: false,
    currentStory: "待触发",
  },
  checkinProgress: {
    completedAnchorIds: [],
    totalPointsEarned: 0,
  },
  cameraExperience: {
    isFullscreen: false,
    cameraOpened: false,
  },
  ui: {
    activeMainView: "home",
  },
};

let appState = loadState();
let toastTimer = null;
let guideTimer = null;
let mediaStream = null;
let recognitionTimer = null;
let lanternBurstTimer = null;

const loginScreen = document.getElementById("login-screen");
const homeScreen = document.getElementById("home-screen");
const phoneInput = document.getElementById("phone-input");
const codeInput = document.getElementById("code-input");
const sendCodeBtn = document.getElementById("send-code-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const identityImage = document.getElementById("identity-image");
const identityRank = document.getElementById("identity-rank");
const identityName = document.getElementById("identity-name");
const identityCode = document.getElementById("identity-code");
const pointsCards = Array.from(document.querySelectorAll("[data-ledger-card]"));
const identityModal = document.getElementById("identity-modal");
const identityGrid = document.getElementById("identity-grid");
const identityConfirmBtn = document.getElementById("identity-confirm-btn");
const arHomeBadge = document.getElementById("ar-home-badge");
const arHomeCopy = document.getElementById("ar-home-copy");

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const shortcutButtons = Array.from(document.querySelectorAll("[data-shortcut-view]"));
const featurePanels = {
  guide: document.getElementById("panel-guide"),
  map: document.getElementById("panel-map"),
  camera: document.getElementById("panel-camera"),
};
const homeSummary = document.getElementById("home-summary");
const detailViews = document.getElementById("detail-views");
const mainViewTitle = document.getElementById("main-view-title");

const guideTitle = document.getElementById("guide-title");
const guideCopy = document.getElementById("guide-copy");
const guideProgress = document.getElementById("guide-progress");
const guideStatus = document.getElementById("guide-status");
const guidePlayBtn = document.getElementById("guide-play-btn");
const guideList = document.getElementById("guide-list");

const mapTitle = document.getElementById("map-title");
const mapCopy = document.getElementById("map-copy");
const mapPoints = Array.from(document.querySelectorAll(".map-point"));

const quickEnvText = document.getElementById("quick-env-text");
const quickRecognitionText = document.getElementById("quick-recognition-text");
const cameraPreviewCopy = document.getElementById("camera-preview-copy");
const cameraTip = document.getElementById("camera-tip");

const cameraFullscreen = document.getElementById("camera-fullscreen");
const cameraModeTitle = document.getElementById("camera-mode-title");
const cameraFullCopy = document.getElementById("camera-full-copy");
const openCameraBtn = document.getElementById("open-camera-btn");
const closeCameraBtn = document.getElementById("close-camera-btn");
const recognizeBtn = document.getElementById("recognize-btn");
const checkinBtn = document.getElementById("checkin-btn");
const sceneButtons = Array.from(document.querySelectorAll(".scene-btn"));
const arSceneSwitch = document.getElementById("ar-scene-switch");
const anchorGrid = document.getElementById("anchor-grid");
const arEnvText = document.getElementById("ar-env-text");
const arRecognitionText = document.getElementById("ar-recognition-text");
const arAnchorText = document.getElementById("ar-anchor-text");
const arStoryText = document.getElementById("ar-story-text");
const arGuidanceText = document.getElementById("ar-guidance-text");
const recognitionLock = document.getElementById("recognition-lock");

const previewVideo = document.getElementById("camera-video");
const fullscreenVideo = document.getElementById("camera-video-full");
const previewFallback = document.getElementById("camera-fallback");
const fullscreenFallback = document.getElementById("camera-fallback-full");
const previewOverlay = document.getElementById("ar-overlay");
const fullscreenOverlay = document.getElementById("ar-overlay-full");
const globalLanternLayer = document.getElementById("global-lantern-layer");

const toast = document.getElementById("toast");
const rewardModal = document.getElementById("reward-modal");
const rewardTitle = document.getElementById("reward-title");
const rewardCopy = document.getElementById("reward-copy");
const rewardCloseBtn = document.getElementById("reward-close-btn");

detectAvailability();
render();
bindEvents();

function bindEvents() {
  sendCodeBtn.addEventListener("click", handleSendCode);
  loginBtn.addEventListener("click", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  identityConfirmBtn.addEventListener("click", confirmIdentitySelection);
  guidePlayBtn.addEventListener("click", toggleGuidePlayback);
  openCameraBtn.addEventListener("click", openFullscreenCamera);
  closeCameraBtn.addEventListener("click", closeFullscreenCamera);
  recognizeBtn.addEventListener("click", startRecognition);
  checkinBtn.addEventListener("click", handleCheckin);
  rewardCloseBtn.addEventListener("click", () => rewardModal.classList.add("hidden"));

  navButtons.forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panel));
  });

  shortcutButtons.forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.shortcutView));
  });

  mapPoints.forEach((button) => {
    button.addEventListener("click", () => setMapPoint(Number(button.dataset.point)));
  });

  sceneButtons.forEach((button) => {
    button.addEventListener("click", () => setArScene(button.dataset.scene));
  });
}

function detectAvailability() {
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = /micromessenger/.test(ua);
  const cameraSupported = Boolean(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  appState.arAvailability = {
    environment: isWechat ? "微信内" : "手机浏览器",
    cameraSupported,
    recognitionMode: "demo",
    status: cameraSupported ? "degraded" : "fallback",
    message: cameraSupported
      ? "当前支持相机预览，图像识别以一期演示模式运行。"
      : "当前环境不支持摄像头，将降级为静态预览与手动打卡说明。",
  };

  saveState();
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
  return cloneDefaultState();
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function mergeState(base, incoming) {
  return {
    ...base,
    ...incoming,
    auth: { ...base.auth, ...(incoming.auth || {}) },
    chrysanthemumIdentity: {
      ...base.chrysanthemumIdentity,
      ...(incoming.chrysanthemumIdentity || {}),
    },
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
    arAvailability: { ...base.arAvailability, ...(incoming.arAvailability || {}) },
    arRecognition: { ...base.arRecognition, ...(incoming.arRecognition || {}) },
    arExperience: { ...base.arExperience, ...(incoming.arExperience || {}) },
    checkinProgress: { ...base.checkinProgress, ...(incoming.checkinProgress || {}) },
    cameraExperience: { ...base.cameraExperience, ...(incoming.cameraExperience || {}) },
    ui: { ...base.ui, ...(incoming.ui || {}) },
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function render() {
  renderAuth();
  renderMainView();
  renderProfile();
  renderPointsLedger();
  renderIdentityModal();
  renderGuide(appState.guide);
  renderMap(appState.mapExperience);
  renderArSummary();
  renderCamera();
}

function renderAuth() {
  const showHome = appState.auth.isLoggedIn && !appState.auth.pendingIdentitySelection;
  loginScreen.classList.toggle("hidden", appState.auth.isLoggedIn);
  homeScreen.classList.toggle("hidden", !showHome);
  phoneInput.value = appState.auth.phone;
  codeInput.value = "";
}

function renderMainView() {
  const activeView = appState.ui.activeMainView || "home";
  const titles = {
    home: "夜游首页",
    guide: "语音导览",
    map: "游玩地图",
    camera: "相机 AR",
  };

  mainViewTitle.textContent = titles[activeView] || "夜游首页";
  homeSummary.classList.toggle("hidden", activeView !== "home");
  detailViews.classList.toggle("hidden", activeView === "home");

  Array.from(document.querySelectorAll("[data-view-shell]")).forEach((shell) => {
    shell.classList.toggle("hidden", shell.dataset.viewShell !== activeView);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === activeView);
  });

  Object.entries(featurePanels).forEach(([key, node]) => {
    node.classList.toggle("hidden", key !== activeView);
  });
}

function renderProfile() {
  const identity = appState.chrysanthemumIdentity;
  identityImage.src = identity.selectedChrysanthemumImage || chrysanthemumOptions[0].image;
  identityImage.alt = identity.selectedChrysanthemumName || "用户选择的小菊花身份";
  identityRank.textContent = identity.identityMark;
  identityName.textContent = identity.selectedChrysanthemumName
    ? `${identity.selectedChrysanthemumName} · 汴京访客`
    : "待选花信 · 汴京访客";
  identityCode.textContent = identity.selectedChrysanthemumId
    ? `菊印编号 ${String(identity.selectedChrysanthemumId).padStart(2, "0")}`
    : "菊印编号 待定";
}

function renderPointsLedger() {
  pointsCards.forEach((card) => {
    const valueNode = card.querySelector("[data-points-value]");
    const listNode = card.querySelector("[data-points-list]");
    const copyNode = card.querySelector("[data-ledger-copy]");
    const type = card.dataset.ledgerCard || "home";
    const completedCount = appState.checkinProgress.completedAnchorIds.length;

    if (valueNode) {
      valueNode.textContent = appState.pointsLedger.balance;
    }

    if (listNode) {
      listNode.innerHTML = appState.pointsLedger.entries
        .slice(0, 5)
        .map((entry) => `<li><span>${entry.label}</span><strong>${entry.amount}</strong></li>`)
        .join("");
    }

    if (copyNode) {
      const guideCompletedCount = appState.guide.completedChapterIndexes.length;
      const copyMap = {
        home: completedCount
          ? `今夜已完成 ${completedCount} 个 AR 点位，最新奖励会实时记入银票账本。`
          : "参与夜游互动后，银票会实时记入今夜账本。",
        guide: appState.guide.isPlaying
          ? "导览正在进行中，章节完整聆听后会自动记入 30 积分。"
          : guideCompletedCount > 0
            ? `已完成 ${guideCompletedCount} 个导览章节聆听，账本已同步记录导览积分。`
            : "导览、打卡与消费所得，都会同步留存在账本中。",
        map:
          completedCount > 0
            ? "已完成点位奖励已入账，可对照地图继续前往下一处夜游节点。"
            : "切换点位与完成任务后，账本会持续更新今夜进度。",
        camera:
          completedCount > 0
            ? "最新打卡奖励已经到账，可继续识别其他锚点完成整条线路。"
            : "识别锚点并完成演绎后，积分会立即记入银票账本。",
      };
      copyNode.textContent = copyMap[type] || copyMap.home;
    }
  });
}

function renderIdentityModal() {
  const isVisible = appState.auth.pendingIdentitySelection;
  identityModal.classList.toggle("hidden", !isVisible);

  if (!isVisible) {
    return;
  }

  identityGrid.innerHTML = chrysanthemumOptions
    .map((item) => {
      const isActive = item.id === appState.chrysanthemumIdentity.selectedChrysanthemumId;
      return `
        <button class="identity-option ${isActive ? "active" : ""}" data-identity-id="${item.id}" type="button">
          <img class="identity-option-image" src="${item.image}" alt="${item.name}" />
          <span class="identity-option-name">${item.name}</span>
          <span class="identity-option-code">${item.code}</span>
        </button>
      `;
    })
    .join("");

  Array.from(identityGrid.querySelectorAll(".identity-option")).forEach((button) => {
    button.addEventListener("click", () => selectIdentity(Number(button.dataset.identityId)));
  });

  identityConfirmBtn.disabled = appState.chrysanthemumIdentity.selectedChrysanthemumId === null;
}

function renderGuide(guide) {
  renderPointsLedger();
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
  renderPointsLedger();
  const current = mapExperience.points[mapExperience.activePoint];
  mapTitle.textContent = current.title;
  mapCopy.textContent = current.copy;

  mapPoints.forEach((point, index) => {
    point.classList.toggle("active", index === mapExperience.activePoint);
  });
}

function renderArSummary() {
  const completed = appState.checkinProgress.completedAnchorIds.length;
  const total = arConfig.anchors.length;
  arHomeBadge.textContent = `${completed}/${total} 点位已完成`;
  arHomeCopy.textContent =
    completed === total
      ? "3 个夜游 AR 点位已全部点亮，可以回看剧情与积分账本。"
      : `前往相机页，完成剩余 ${total - completed} 个夜游 AR 点位打卡，解锁剧情与积分。`;
}

function renderCamera() {
  renderPointsLedger();
  renderCameraPreview();
  renderCameraFullscreen();
}

function renderCameraPreview() {
  quickEnvText.textContent = appState.arAvailability.environment;
  quickRecognitionText.textContent = getRecognitionStatusText();
  cameraPreviewCopy.textContent = appState.arAvailability.message;
  cameraTip.textContent =
    appState.arAvailability.status === "fallback"
      ? "当前环境不支持摄像头，可先查看锚点说明与手动打卡演示。"
      : "进入全屏后选择 3 个固定锚点，完成识别、演绎与积分闭环。";

  syncCameraView(Boolean(mediaStream));
}

function renderCameraFullscreen() {
  const { arRecognition, arExperience, arAvailability, cameraExperience, checkinProgress } =
    appState;
  const activeAnchor = getActiveAnchor();
  const recognizedAnchor = getRecognizedAnchor();

  cameraFullscreen.classList.toggle("hidden", !cameraExperience.isFullscreen);
  document.body.style.overflow = cameraExperience.isFullscreen ? "hidden" : "";

  arEnvText.textContent =
    arAvailability.status === "fallback"
      ? `${arAvailability.environment} · 静态演示`
      : `${arAvailability.environment} · 相机可用`;
  arRecognitionText.textContent = getRecognitionStatusText();
  arAnchorText.textContent = activeAnchor ? activeAnchor.title : "未选择";
  arStoryText.textContent = arExperience.currentStory || "待触发";
  arGuidanceText.textContent = getGuidanceText();
  cameraModeTitle.textContent = recognizedAnchor ? `${recognizedAnchor.title} · 已锁定` : "H5 AR 识别";
  cameraFullCopy.textContent = getGuidanceText();
  recognitionLock.classList.toggle("hidden", !recognizedAnchor);
  arSceneSwitch.classList.toggle("hidden", !recognizedAnchor);
  fullscreenOverlay.classList.toggle("hidden", !recognizedAnchor);
  previewOverlay.classList.toggle("hidden", !recognizedAnchor);

  sceneButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scene === arExperience.currentScene);
  });

  recognizeBtn.disabled = !activeAnchor || arRecognition.isRecognizing;
  checkinBtn.disabled = !recognizedAnchor;
  checkinBtn.textContent = recognizedAnchor ? "播放演绎并完成打卡" : "请先识别锚点";

  anchorGrid.innerHTML = arConfig.anchors
    .map((anchor) => {
      const isActive = anchor.id === arRecognition.activeAnchorId;
      const isCompleted = checkinProgress.completedAnchorIds.includes(anchor.id);
      const stateText = isCompleted ? "已完成" : isActive ? "待识别" : "未开始";
      return `
        <button class="anchor-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}" data-anchor-id="${anchor.id}" type="button">
          <span class="anchor-title">${anchor.title}</span>
          <span class="anchor-subtitle">${anchor.subtitle}</span>
          <span class="anchor-state">${stateText}</span>
        </button>
      `;
    })
    .join("");

  Array.from(anchorGrid.querySelectorAll(".anchor-item")).forEach((button) => {
    button.addEventListener("click", () => selectAnchor(button.dataset.anchorId));
  });

  syncArSceneLayers(arExperience.currentScene);
  syncCameraView(Boolean(mediaStream));
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
  appState.auth.pendingIdentitySelection = true;
  appState.auth.phone = phone;
  appState.chrysanthemumIdentity.selectedChrysanthemumId = null;
  appState.chrysanthemumIdentity.selectedChrysanthemumImage = "";
  appState.chrysanthemumIdentity.selectedChrysanthemumName = "";
  saveState();
  render();
  showToast("请选择你的小菊身份");
}

function handleLogout() {
  stopGuidePlayback();
  stopCameraStream();
  resetRecognitionState();
  appState = initializeState();
  detectAvailability();
  saveState();
  render();
  showToast("已退出夜游身份");
}

function selectIdentity(id) {
  const option = chrysanthemumOptions.find((item) => item.id === id);
  if (!option) {
    return;
  }

  appState.chrysanthemumIdentity.selectedChrysanthemumId = option.id;
  appState.chrysanthemumIdentity.selectedChrysanthemumImage = option.image;
  appState.chrysanthemumIdentity.selectedChrysanthemumName = option.name;
  saveState();
  renderIdentityModal();
}

function confirmIdentitySelection() {
  if (appState.chrysanthemumIdentity.selectedChrysanthemumId === null) {
    showToast("请先选择一盆小菊花");
    return;
  }

  appState.auth.pendingIdentitySelection = false;
  saveState();
  render();
  showToast("小菊身份已确认，欢迎入园");
}

function switchPanel(panel) {
  appState.ui.activeMainView = panel;
  saveState();
  renderMainView();
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
      handleGuideCompletion();
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

function handleGuideCompletion() {
  const chapterIndex = appState.guide.currentIndex;
  const currentChapter = appState.guide.items[chapterIndex];
  const alreadyCompleted = appState.guide.completedChapterIndexes.includes(chapterIndex);

  if (alreadyCompleted || !currentChapter) {
    return;
  }

  appState.guide.completedChapterIndexes.push(chapterIndex);
  appState.checkinProgress.totalPointsEarned += 30;
  awardPoints({
    amount: 30,
    label: `${currentChapter.title} 聆听`,
  });
  showToast(`已完成《${currentChapter.title}》聆听，银票积分 +30`);
}

function setMapPoint(index) {
  appState.mapExperience.activePoint = index;
  saveState();
  renderMap(appState.mapExperience);
}

function selectAnchor(anchorId) {
  appState.arRecognition.activeAnchorId = anchorId;
  appState.arRecognition.recognizedAnchorId = null;
  appState.arRecognition.stability = 0;
  appState.arRecognition.failureReason = "";
  appState.arExperience.currentAnchorId = anchorId;
  appState.arExperience.currentStory = "待识别";
  const anchor = getAnchorById(anchorId);
  if (anchor) {
    appState.arExperience.currentScene = anchor.scene;
  }
  saveState();
  renderCamera();
}

function setArScene(scene) {
  appState.arExperience.currentScene = scene;
  saveState();
  renderCamera();
}

async function openFullscreenCamera() {
  appState.cameraExperience.isFullscreen = true;
  saveState();
  renderCamera();
  await startCameraStream();
}

function closeFullscreenCamera() {
  appState.cameraExperience.isFullscreen = false;
  resetRecognitionState();
  saveState();
  renderCamera();
}

async function startCameraStream() {
  if (!appState.arAvailability.cameraSupported) {
    showToast("当前环境不支持摄像头，已切换为静态演示模式");
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
    appState.arAvailability.status = "degraded";
    appState.arAvailability.message = "摄像头未授权，已降级为静态预览与手动打卡说明。";
    saveState();
    renderCamera();
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

function startRecognition() {
  if (!appState.arRecognition.activeAnchorId) {
    showToast("请先选择一个固定锚点");
    return;
  }

  if (appState.arRecognition.isRecognizing) {
    return;
  }

  resetRecognitionState(false);
  appState.arRecognition.isRecognizing = true;
  appState.arRecognition.failureReason = "";
  appState.arExperience.currentStory = "识别中";
  saveState();
  renderCamera();
  showToast("正在识别锚点，请保持画面稳定");

  recognitionTimer = window.setTimeout(() => {
    const anchor = getActiveAnchor();
    if (!anchor) {
      return;
    }

    appState.arRecognition.isRecognizing = false;
    appState.arRecognition.recognizedAnchorId = anchor.id;
    appState.arRecognition.stability = 92;
    appState.arExperience.currentAnchorId = anchor.id;
    appState.arExperience.currentScene = anchor.scene;
    appState.arExperience.currentStory = anchor.story;
    saveState();
    renderCamera();
    showToast(`已识别 ${anchor.title}`);
  }, 1800);
}

function handleCheckin() {
  const anchor = getRecognizedAnchor();
  if (!anchor) {
    showToast("请先完成锚点识别");
    return;
  }

  const isCompleted = appState.checkinProgress.completedAnchorIds.includes(anchor.id);
  if (isCompleted) {
    showToast("该点位已完成，可继续体验其他点位");
    return;
  }

  appState.arExperience.isPlaying = true;
  appState.arExperience.currentScene = anchor.scene;
  appState.arExperience.currentStory = anchor.story;
  saveState();
  renderCamera();

  window.setTimeout(() => {
    finishCheckin(anchor);
  }, 1200);
}

function finishCheckin(anchor) {
  appState.arExperience.isPlaying = false;
  appState.arExperience.isCompleted = true;
  appState.checkinProgress.completedAnchorIds.push(anchor.id);
  appState.checkinProgress.totalPointsEarned += anchor.points;
  awardPoints({
    amount: anchor.points,
    label: `${anchor.title} 打卡`,
  });

  rewardTitle.textContent = anchor.rewardTitle;
  rewardCopy.textContent = anchor.rewardCopy;
  rewardModal.classList.remove("hidden");

  saveState();
  render();
}

function awardPoints({ amount, label }) {
  appState.pointsLedger.balance += amount;
  appState.pointsLedger.entries.unshift({
    label,
    amount: `+${amount}`,
  });
  appState.pointsLedger.entries = appState.pointsLedger.entries.slice(0, 8);
  renderPointsLedger();
  triggerLanternFeedback();
}

function resetRecognitionState(clearAnchor = true) {
  if (recognitionTimer) {
    window.clearTimeout(recognitionTimer);
    recognitionTimer = null;
  }

  appState.arRecognition.isRecognizing = false;
  appState.arRecognition.recognizedAnchorId = null;
  appState.arRecognition.stability = 0;
  appState.arRecognition.failureReason = "";
  appState.arExperience.isPlaying = false;
  appState.arExperience.isCompleted = false;
  appState.arExperience.currentStory = "待触发";

  if (clearAnchor) {
    appState.arRecognition.activeAnchorId = null;
    appState.arExperience.currentAnchorId = null;
  }
}

function syncCameraView(hasStream) {
  previewVideo.classList.toggle("hidden", !hasStream);
  fullscreenVideo.classList.toggle("hidden", !hasStream);
  previewFallback.classList.toggle("hidden", hasStream);
  fullscreenFallback.classList.toggle("hidden", hasStream);
}

function triggerLanternFeedback() {
  const activeView = appState.cameraExperience.isFullscreen ? "camera" : appState.ui.activeMainView;
  const layer = globalLanternLayer;

  if (!layer || activeView === "home") {
    return;
  }

  if (lanternBurstTimer) {
    window.clearTimeout(lanternBurstTimer);
    lanternBurstTimer = null;
  }

  layer.innerHTML = "";
  const lanternCount = Math.max(1, Math.min(3, Math.floor(Math.random() * 3) + 1));

  for (let index = 0; index < lanternCount; index += 1) {
    const lantern = document.createElement("span");
    const drift = (Math.random() * 18 - 9).toFixed(2);
    const scale = (0.82 + Math.random() * 0.42).toFixed(2);
    const duration = (4.2 + Math.random() * 1.8).toFixed(2);
    const delay = (index * 0.22 + Math.random() * 0.18).toFixed(2);
    const left = (16 + Math.random() * 68).toFixed(2);

    lantern.className = "sky-lantern";
    lantern.style.left = `${left}%`;
    lantern.style.setProperty("--lantern-drift", `${drift}px`);
    lantern.style.setProperty("--lantern-scale", scale);
    lantern.style.setProperty("--lantern-duration", `${duration}s`);
    lantern.style.setProperty("--lantern-delay", `${delay}s`);
    layer.appendChild(lantern);
  }

  lanternBurstTimer = window.setTimeout(() => {
    layer.innerHTML = "";
    lanternBurstTimer = null;
  }, 7000);
}

function syncArSceneLayers(scene) {
  const layers = Array.from(document.querySelectorAll(".ar-layer"));
  layers.forEach((layer) => {
    layer.classList.toggle("hidden", layer.dataset.arScene !== scene);
  });
}

function getAnchorById(anchorId) {
  return arConfig.anchors.find((anchor) => anchor.id === anchorId) || null;
}

function getActiveAnchor() {
  return getAnchorById(appState.arRecognition.activeAnchorId);
}

function getRecognizedAnchor() {
  return getAnchorById(appState.arRecognition.recognizedAnchorId);
}

function getRecognitionStatusText() {
  if (appState.arAvailability.status === "fallback") {
    return "静态演示";
  }
  if (appState.arRecognition.isRecognizing) {
    return "识别中";
  }
  if (appState.arRecognition.recognizedAnchorId) {
    return `已锁定 ${getRecognizedAnchor().title}`;
  }
  if (appState.arRecognition.activeAnchorId) {
    return "待识别";
  }
  return "未开始";
}

function getGuidanceText() {
  if (appState.arAvailability.status === "fallback") {
    return "当前环境不支持相机，请查看锚点说明并体验静态演示流程。";
  }
  if (appState.arRecognition.isRecognizing) {
    return "请保持镜头稳定，避免反光和大角度偏移。";
  }
  if (appState.arRecognition.recognizedAnchorId) {
    return `${getRecognizedAnchor().story} 点击下方按钮即可播放演绎并完成打卡。`;
  }
  if (appState.arRecognition.activeAnchorId) {
    return getActiveAnchor().guidance;
  }
  return "请先选择一个固定锚点，再开始识别。";
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

function toChineseNumber(value) {
  const map = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return map[value] || String(value);
}
