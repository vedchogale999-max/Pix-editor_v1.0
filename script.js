const fileInput = document.getElementById("fileInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const uploadBox = document.getElementById("uploadBox");
const emptyState = document.getElementById("emptyState");
const imageInfo = document.getElementById("imageInfo");
const canvasWrap = document.getElementById("canvasWrap");
const changeImageBtn = document.getElementById("changeImageBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const resetBtn = document.getElementById("resetBtn");
const exportTopBtn = document.getElementById("exportTopBtn");

const brightnessRange = document.getElementById("brightnessRange");
const contrastRange = document.getElementById("contrastRange");
const saturationRange = document.getElementById("saturationRange");
const warmthRange = document.getElementById("warmthRange");
const shineRange = document.getElementById("shineRange");
const sharpnessRange = document.getElementById("sharpnessRange");
const blurRange = document.getElementById("blurRange");

const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const saturationValue = document.getElementById("saturationValue");
const warmthValue = document.getElementById("warmthValue");
const shineValue = document.getElementById("shineValue");
const sharpnessValue = document.getElementById("sharpnessValue");
const blurValue = document.getElementById("blurValue");

const exportFormat = document.getElementById("exportFormat");
const qualityRange = document.getElementById("qualityRange");
const qualityValue = document.getElementById("qualityValue");
const fileName = document.getElementById("fileName");

const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");
const keepRatio = document.getElementById("keepRatio");
const applyResizeBtn = document.getElementById("applyResizeBtn");

const startCropBtn = document.getElementById("startCropBtn");
const cropOverlay = document.getElementById("cropOverlay");
const cropBox = document.getElementById("cropBox");
const cropControls = document.getElementById("cropControls");
const applyCropBtn = document.getElementById("applyCropBtn");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const resetCropBtn = document.getElementById("resetCropBtn");

const startTextBtn = document.getElementById("startTextBtn");
const textEditWrap = document.getElementById("textEditWrap");
const textEditBox = document.getElementById("textEditBox");
const textResizeHandle = document.getElementById("textResizeHandle");
const textEditorToolbar = document.getElementById("textEditorToolbar");

const fontToolBtn = document.getElementById("fontToolBtn");
const colorToolBtn = document.getElementById("colorToolBtn");
const addTextLayerBtn = document.getElementById("addTextLayerBtn");
const boldToolBtn = document.getElementById("boldToolBtn");
const textDoneBtn = document.getElementById("textDoneBtn");
const deleteTextBtn = document.getElementById("deleteTextBtn");

const fontPanel = document.getElementById("fontPanel");
const colorPanel = document.getElementById("colorPanel");
const fontChips = document.querySelectorAll(".font-chip");
const colorDots = document.querySelectorAll(".color-dot");

const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");
const flipXBtn = document.getElementById("flipXBtn");
const flipYBtn = document.getElementById("flipYBtn");

const restoreBox = document.getElementById("restoreBox");
const restoreYesBtn = document.getElementById("restoreYesBtn");
const restoreNoBtn = document.getElementById("restoreNoBtn");

const exportModal = document.getElementById("exportModal");
const exportPreviewImg = document.getElementById("exportPreviewImg");
const exportMetaText = document.getElementById("exportMetaText");
const exportConfirmBtn = document.getElementById("exportConfirmBtn");
const exportCancelBtn = document.getElementById("exportCancelBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let pendingExportBlob = null;
let pendingExportUrl = "";
let pendingExportFileName = "";

let sourceImage = null;
let initialImageDataUrl = "";
let sourceImageDataUrl = "";

const installBtn = document.getElementById("installBtn");
const installModal = document.getElementById("installModal");
const installNowBtn = document.getElementById("installNowBtn");
const installLaterBtn = document.getElementById("installLaterBtn");
const installCloseBtn = document.getElementById("installCloseBtn");

const appPopup = document.getElementById("appPopup");
const appPopupIcon = document.getElementById("appPopupIcon");
const appPopupTitle = document.getElementById("appPopupTitle");
const appPopupMessage = document.getElementById("appPopupMessage");
const appPopupActionBtn = document.getElementById("appPopupActionBtn");
const appPopupCloseBtn = document.getElementById("appPopupCloseBtn");

let deferredInstallPrompt = null;
let appPopupAction = null;

let state = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    shine: 0,
    sharpness: 0,
    blur: 0,
    filter: "none",
    textLayers: [],
    selectedTextId: null
};

let undoStack = [];
let redoStack = [];
let isRestoring = false;
const MAX_HISTORY = 40;

let saveTimer = null;
let pendingRestoreData = null;

let cropMode = false;
let cropRect = { x: 0, y: 0, w: 0, h: 0 };
let cropAction = null;
let cropStart = null;

let textMode = false;
let textEditBefore = null;
let textDrag = null;
let textResize = null;
let textIdCounter = 1;

fileInput.addEventListener("change", loadImage);
changeImageBtn.addEventListener("click", () => fileInput.click());

function loadImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        const dataUrl = event.target.result;

        initialImageDataUrl = dataUrl;

        setSourceImage(dataUrl, () => {
            resetAdjustControls();

            undoStack = [];
            redoStack = [];
            updateHistoryButtons();

            exitCropMode();
            exitTextMode(false);

            uploadBox.style.display = "none";
            restoreBox.style.display = "none";
            changeImageBtn.style.display = "block";

            renderImage();
            saveDraftNow();
        });
    };

    reader.readAsDataURL(file);
}

function setSourceImage(dataUrl, callback) {
    const img = new Image();

    img.onload = function () {
        sourceImage = img;
        sourceImageDataUrl = dataUrl;

        resizeWidth.value = img.width;
        resizeHeight.value = img.height;

        if (callback) callback();
    };

    img.src = dataUrl;
}

function renderImage() {
    if (!sourceImage) return;

    normalizeState();

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const combined = getCombinedAdjustments();

    const brightness = Math.max(0, 100 + Number(combined.brightness || 0));
    const contrast = Math.max(0, 100 + Number(combined.contrast || 0));
    const saturation = Math.max(0, 100 + Number(combined.saturation || 0));
    const blur = Math.max(0, Number(combined.blur || 0));

    ctx.filter = `
  brightness(${brightness}%)
  contrast(${contrast}%)
  saturate(${saturation}%)
  blur(${blur}px)
`;

    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    ctx.filter = "none";

    applyPixelEffects();
    applyShineEffect();
    applySharpnessEffect();

    if (textMode) {
        drawTextLayers(ctx, state.selectedTextId);
    } else {
        drawTextLayers(ctx, null);
    }

    canvasWrap.style.display = "block";
    emptyState.style.display = "none";
    imageInfo.textContent = `${canvas.width} × ${canvas.height}px`;

    if (textMode) {
        updateTextOverlayFromState();
    }

    scheduleDraftSave();
}

function applyPixelEffects() {
    const combined = getCombinedAdjustments();
    const preset = combined.preset;
    const totalWarmth = combined.warmth;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // warmth
        r += totalWarmth * 0.7;
        b -= totalWarmth * 0.7;

        // cool blue preset
        if (preset.coolBoost > 0) {
            r -= preset.coolBoost * 0.35;
            g += preset.coolBoost * 0.08;
            b += preset.coolBoost * 0.55;
        }

        // vintage tone
        if (preset.vintageTone !== 0) {
            if (preset.vintageTone > 0) {
                r += preset.vintageTone * 0.45;
                g += preset.vintageTone * 0.18;
                b -= preset.vintageTone * 0.28;
            } else {
                const greenTone = Math.abs(preset.vintageTone);
                r -= greenTone * 0.18;
                g += greenTone * 0.38;
                b -= greenTone * 0.08;
            }
        }

        // black & white
        if (preset.bw) {
            const gray = r * 0.3 + g * 0.59 + b * 0.11;
            r = gray;
            g = gray;
            b = gray;
        }

        // sepia
        if (preset.sepia) {
            const tr = 0.393 * r + 0.769 * g + 0.189 * b;
            const tg = 0.349 * r + 0.686 * g + 0.168 * b;
            const tb = 0.272 * r + 0.534 * g + 0.131 * b;

            r = tr;
            g = tg;
            b = tb;
        }

        // fade matte lift
        if (preset.fade > 0) {
            const fadeAmount = preset.fade / 100;
            r = r + (235 - r) * fadeAmount;
            g = g + (235 - g) * fadeAmount;
            b = b + (235 - b) * fadeAmount;
        }

        // matte flatten
        if (preset.matte > 0) {
            const matteAmount = preset.matte / 100;
            const avg = (r + g + b) / 3;

            r = r + (avg - r) * matteAmount * 0.55;
            g = g + (avg - g) * matteAmount * 0.55;
            b = b + (avg - b) * matteAmount * 0.55;
        }

        // grain
        if (preset.grain > 0) {
            const grain = (Math.random() - 0.5) * preset.grain * 1.2;
            r += grain;
            g += grain;
            b += grain;
        }

        data[i] = clamp(r);
        data[i + 1] = clamp(g);
        data[i + 2] = clamp(b);
    }

    ctx.putImageData(imageData, 0, 0);

    if (preset.vignette > 0) {
        applyVignette(preset.vignette);
    }
}

function applyVignette(amount) {
    if (amount <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = Math.min(0.45, amount / 100);

    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) * 0.15,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.72
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.65, "rgba(120,120,120,1)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
}

function applyShineEffect() {
    const combined = getCombinedAdjustments();
    const shine = Number(combined.shine || 0);

    if (shine === 0) return;

    // POSITIVE SHINE = beauty glow / glossy soft highlight
    if (shine > 0) {
        const glowCanvas = document.createElement("canvas");
        const glowCtx = glowCanvas.getContext("2d", { willReadFrequently: true });

        glowCanvas.width = canvas.width;
        glowCanvas.height = canvas.height;

        glowCtx.drawImage(canvas, 0, 0);

        // 1. Soft blurred glow layer
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = Math.min(0.55, shine / 170);

        ctx.filter = `
      blur(${Math.max(2, shine * 0.10)}px)
      brightness(${105 + shine * 0.8}%)
      saturate(${100 + shine * 0.18}%)
    `;

        ctx.drawImage(glowCanvas, 0, 0);
        ctx.restore();

        // 2. Beauty highlight from upper side
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        ctx.globalAlpha = Math.min(0.38, shine / 210);

        const topGlow = ctx.createRadialGradient(
            canvas.width * 0.5,
            canvas.height * 0.18,
            0,
            canvas.width * 0.5,
            canvas.height * 0.18,
            Math.max(canvas.width, canvas.height) * 0.8
        );

        topGlow.addColorStop(0, "rgba(255,255,255,0.95)");
        topGlow.addColorStop(0.45, "rgba(255,245,230,0.35)");
        topGlow.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 3. Small glossy boost only on bright pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            const avg = (r + g + b) / 3;
            const highlight = Math.pow(avg / 255, 2.2);

            const boost = shine * 0.22 * highlight;

            r += boost;
            g += boost * 0.95;
            b += boost * 0.82;

            // warm beauty tone
            r += shine * 0.06 * highlight;
            g += shine * 0.025 * highlight;

            data[i] = clamp(r);
            data[i + 1] = clamp(g);
            data[i + 2] = clamp(b);
        }

        ctx.putImageData(imageData, 0, 0);
        return;
    }

    // NEGATIVE SHINE = remove harsh/oily highlights
    const amount = Math.abs(shine);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const avg = (r + g + b) / 3;

        // only affect brighter shiny pixels more
        const highlight = Math.pow(avg / 255, 1.6);

        // reduce bright reflection
        const reduce = amount * 0.65 * highlight;

        r -= reduce;
        g -= reduce;
        b -= reduce;

        // flatten harsh highlights softly
        const gray = (r + g + b) / 3;
        const flatten = Math.min(0.32, amount / 320) * highlight;

        r = r + (gray - r) * flatten;
        g = g + (gray - g) * flatten;
        b = b + (gray - b) * flatten;

        // add very slight matte feel
        const matte = amount * 0.08 * highlight;
        r -= matte;
        g -= matte;
        b -= matte;

        data[i] = clamp(r);
        data[i + 1] = clamp(g);
        data[i + 2] = clamp(b);
    }

    ctx.putImageData(imageData, 0, 0);
}

function applySharpnessEffect() {
    const combined = getCombinedAdjustments();
    const sharpness = Number(combined.sharpness || 0);

    if (sharpness === 0) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const src = imageData.data;
    const output = new Uint8ClampedArray(src);

    const width = canvas.width;
    const height = canvas.height;

    // Positive = sharpen, Negative = soften
    const amount = Math.abs(sharpness) / 100;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;

            const top = ((y - 1) * width + x) * 4;
            const bottom = ((y + 1) * width + x) * 4;
            const left = (y * width + (x - 1)) * 4;
            const right = (y * width + (x + 1)) * 4;

            for (let c = 0; c < 3; c++) {
                const centerValue = src[i + c];

                const neighborAverage =
                    (src[top + c] +
                        src[bottom + c] +
                        src[left + c] +
                        src[right + c]) / 4;

                let newValue;

                if (sharpness > 0) {
                    // Sharpen details
                    newValue = centerValue + (centerValue - neighborAverage) * amount * 1.8;
                } else {
                    // Soften details
                    newValue = centerValue + (neighborAverage - centerValue) * amount * 0.85;
                }

                output[i + c] = clamp(newValue);
            }

            output[i + 3] = src[i + 3];
        }
    }

    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);
}

function randomGrain() {
    return Math.random() * 12 - 6;
}

function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

/* Multiple Text Layers */

function createTextId() {
    return `text-${Date.now()}-${textIdCounter++}`;
}

function createTextLayer(content = "Text") {
    const defaultSize = sourceImage
        ? Math.max(34, Math.round(Math.min(sourceImage.width, sourceImage.height) * 0.08))
        : 42;

    return {
        id: createTextId(),
        content,
        x: sourceImage ? sourceImage.width / 2 : 0,
        y: sourceImage ? sourceImage.height / 2 : 0,
        size: defaultSize,
        color: "#ffffff",
        fontFamily: "Arial",
        bold: true,
        visible: true
    };
}

function normalizeState() {
    if (!Array.isArray(state.textLayers)) {
        state.textLayers = [];

        if (state.text && state.text.visible && state.text.content) {
            const migrated = {
                id: createTextId(),
                content: state.text.content || "Text",
                x: Number(state.text.x || 0),
                y: Number(state.text.y || 0),
                size: Number(state.text.size || 42),
                color: state.text.color || "#ffffff",
                fontFamily: state.text.fontFamily || "Arial",
                bold: typeof state.text.bold === "boolean" ? state.text.bold : true,
                visible: true
            };

            state.textLayers.push(migrated);
            state.selectedTextId = migrated.id;
        }
    }

    state.textLayers.forEach(layer => {
        if (!layer.id) layer.id = createTextId();
        if (!layer.fontFamily) layer.fontFamily = "Arial";
        if (!layer.color) layer.color = "#ffffff";
        if (typeof layer.bold !== "boolean") layer.bold = true;
        if (typeof layer.size !== "number") layer.size = Number(layer.size || 42);
        if (typeof layer.x !== "number") layer.x = Number(layer.x || 0);
        if (typeof layer.y !== "number") layer.y = Number(layer.y || 0);
        if (typeof layer.visible !== "boolean") layer.visible = true;
    });

    if (state.selectedTextId && !state.textLayers.some(layer => layer.id === state.selectedTextId)) {
        state.selectedTextId = state.textLayers[0] ? state.textLayers[0].id : null;
    }

    if (typeof state.brightness !== "number") state.brightness = Number(state.brightness || 0);
    if (typeof state.contrast !== "number") state.contrast = Number(state.contrast || 0);
    if (typeof state.saturation !== "number") state.saturation = Number(state.saturation || 0);
    if (typeof state.warmth !== "number") state.warmth = Number(state.warmth || 0);
    if (typeof state.shine !== "number") state.shine = Number(state.shine || 0);
    if (typeof state.sharpness !== "number") state.sharpness = Number(state.sharpness || 0);
    if (typeof state.blur !== "number") state.blur = Number(state.blur || 0);
    if (!state.filter) state.filter = "none";
}

function getActivePresetSettings() {
    const preset = FILTER_PRESETS[state.filter] || FILTER_PRESETS.none;
    return { ...FILTER_PRESETS.none, ...preset };
}

function clampAdjust(value, min = -100, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function getCombinedAdjustments() {
    const preset = getActivePresetSettings();

    return {
        brightness: clampAdjust(Number(state.brightness || 0) + Number(preset.brightness || 0)),
        contrast: clampAdjust(Number(state.contrast || 0) + Number(preset.contrast || 0)),
        saturation: clampAdjust(Number(state.saturation || 0) + Number(preset.saturation || 0)),
        warmth: clampAdjust(Number(state.warmth || 0) + Number(preset.warmth || 0)),
        shine: clampAdjust(Number(state.shine || 0) + Number(preset.shine || 0)),
        sharpness: clampAdjust(Number(state.sharpness || 0) + Number(preset.sharpness || 0)),
        blur: Math.max(0, Math.min(20, Number(state.blur || 0) + Number(preset.blur || 0))),
        preset
    };
}

function getSelectedTextLayer() {
    normalizeState();

    return state.textLayers.find(layer => layer.id === state.selectedTextId) || null;
}

function drawTextLayers(targetCtx, skipId = null) {
    normalizeState();

    state.textLayers.forEach(layer => {
        if (layer.id !== skipId) {
            drawSingleTextLayer(targetCtx, layer);
        }
    });
}

function drawSingleTextLayer(targetCtx, layer) {
    if (!layer.visible || !layer.content.trim()) return;

    targetCtx.save();

    const weight = layer.bold ? "bold" : "normal";
    targetCtx.font = `${weight} ${layer.size}px "${layer.fontFamily}"`;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";

    targetCtx.lineWidth = Math.max(2, layer.size * 0.08);
    targetCtx.strokeStyle = "rgba(0, 0, 0, 0.65)";
    targetCtx.fillStyle = layer.color;

    const lines = layer.content.split("\n");
    const lineHeight = layer.size * 1.15;
    const startY = layer.y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        targetCtx.strokeText(line, layer.x, y);
        targetCtx.fillText(line, layer.x, y);
    });

    targetCtx.restore();
}

function getDisplayScale() {
    const rect = canvas.getBoundingClientRect();

    return {
        scaleX: rect.width / canvas.width,
        scaleY: rect.height / canvas.height,
        rect
    };
}

function updateTextOverlayFromState() {
    if (!sourceImage || !textMode) return;

    normalizeState();

    const layer = getSelectedTextLayer();

    if (!layer) {
        textEditWrap.style.display = "none";
        return;
    }

    const { scaleX, scaleY } = getDisplayScale();

    textEditWrap.style.display = "block";
    textEditWrap.style.left = `${layer.x * scaleX}px`;
    textEditWrap.style.top = `${layer.y * scaleY}px`;

    if (textEditBox.innerText !== layer.content) {
        textEditBox.innerText = layer.content || "Text";
    }

    textEditBox.style.color = layer.color;
    textEditBox.style.fontFamily = layer.fontFamily;
    textEditBox.style.fontWeight = layer.bold ? "900" : "500";
    textEditBox.style.fontSize = `${Math.max(18, layer.size * scaleX)}px`;

    boldToolBtn.classList.toggle("active", layer.bold);

    fontChips.forEach(chip => {
        chip.classList.toggle("active", chip.dataset.font === layer.fontFamily);
    });

    colorDots.forEach(dot => {
        dot.classList.toggle(
            "active",
            (dot.dataset.color || "").toLowerCase() === (layer.color || "").toLowerCase()
        );
    });
}

function updateSelectedTextFromOverlay() {
    if (!sourceImage || !textMode) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    const { scaleX, scaleY } = getDisplayScale();

    const left = parseFloat(textEditWrap.style.left || "0");
    const top = parseFloat(textEditWrap.style.top || "0");

    layer.x = left / scaleX;
    layer.y = top / scaleY;
    layer.content = textEditBox.innerText.trim();
    layer.visible = layer.content.length > 0;
}

function enterTextMode() {
    if (!sourceImage) {
        showUploadRequiredPopup();
        return;
    }

    if (cropMode) {
        exitCropMode();
    }

    normalizeState();

    textMode = true;
    textEditBefore = {
        textLayers: JSON.parse(JSON.stringify(state.textLayers)),
        selectedTextId: state.selectedTextId
    };

    if (state.textLayers.length === 0) {
        const layer = createTextLayer("Text");
        state.textLayers.push(layer);
        state.selectedTextId = layer.id;
    }

    if (!state.selectedTextId) {
        state.selectedTextId = state.textLayers[0].id;
    }

    textEditorToolbar.style.display = "block";
    textEditWrap.style.display = "block";

    fontPanel.classList.remove("show");
    colorPanel.classList.remove("show");
    fontToolBtn.classList.remove("active");
    colorToolBtn.classList.remove("active");

    renderImage();
    updateTextOverlayFromState();

    setTimeout(() => {
        textEditBox.focus();
        selectEditableText(textEditBox);
    }, 150);
}

function exitTextMode(saveChanges = true) {
    if (textMode && saveChanges) {
        updateSelectedTextFromOverlay();
        saveTextModeHistoryIfChanged();
    }

    textMode = false;
    textEditBefore = null;
    textDrag = null;
    textResize = null;

    textEditorToolbar.style.display = "none";
    textEditWrap.style.display = "none";
    fontPanel.classList.remove("show");
    colorPanel.classList.remove("show");
    fontToolBtn.classList.remove("active");
    colorToolBtn.classList.remove("active");
}

function saveTextModeHistoryIfChanged() {
    if (!sourceImage || !textEditBefore) return;

    const oldText = JSON.stringify(textEditBefore);
    const newText = JSON.stringify({
        textLayers: state.textLayers,
        selectedTextId: state.selectedTextId
    });

    if (oldText === newText) return;

    const previousSnapshot = getSnapshot();
    previousSnapshot.state.textLayers = JSON.parse(JSON.stringify(textEditBefore.textLayers));
    previousSnapshot.state.selectedTextId = textEditBefore.selectedTextId;

    undoStack.push(previousSnapshot);

    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    redoStack = [];
    updateHistoryButtons();
}

function selectEditableText(element) {
    const range = document.createRange();
    range.selectNodeContents(element);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function addNewTextLayer() {
    if (!sourceImage || !textMode) return;

    updateSelectedTextFromOverlay();

    const newLayer = createTextLayer("Text");
    newLayer.x += state.textLayers.length * 12;
    newLayer.y += state.textLayers.length * 12;

    state.textLayers.push(newLayer);
    state.selectedTextId = newLayer.id;

    renderImage();
    updateTextOverlayFromState();

    setTimeout(() => {
        textEditBox.focus();
        selectEditableText(textEditBox);
    }, 100);
}

function getTextLayerAtPoint(x, y) {
    normalizeState();

    for (let i = state.textLayers.length - 1; i >= 0; i--) {
        const layer = state.textLayers[i];

        if (!layer.visible || !layer.content.trim()) continue;

        ctx.save();
        const weight = layer.bold ? "bold" : "normal";
        ctx.font = `${weight} ${layer.size}px "${layer.fontFamily}"`;

        const lines = layer.content.split("\n");
        const widths = lines.map(line => ctx.measureText(line).width);
        const maxWidth = Math.max(...widths);
        ctx.restore();

        const lineHeight = layer.size * 1.15;
        const totalHeight = lines.length * lineHeight;
        const padding = layer.size * 0.35;

        if (
            x >= layer.x - maxWidth / 2 - padding &&
            x <= layer.x + maxWidth / 2 + padding &&
            y >= layer.y - totalHeight / 2 - padding &&
            y <= layer.y + totalHeight / 2 + padding
        ) {
            return layer;
        }
    }

    return null;
}

/* History */

function getSnapshot() {
    return {
        sourceImageDataUrl,
        initialImageDataUrl,
        state: JSON.parse(JSON.stringify(state))
    };
}

function saveHistory() {
    if (!sourceImage || isRestoring) return;

    const snapshot = getSnapshot();
    const last = undoStack[undoStack.length - 1];

    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;

    undoStack.push(snapshot);

    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    redoStack = [];
    updateHistoryButtons();
}

function restoreSnapshot(snapshot) {
    if (!snapshot) return;

    isRestoring = true;

    initialImageDataUrl = snapshot.initialImageDataUrl || snapshot.sourceImageDataUrl;
    state = JSON.parse(JSON.stringify(snapshot.state));
    normalizeState();

    setSourceImage(snapshot.sourceImageDataUrl, () => {
        syncControlsFromState();
        exitCropMode();
        exitTextMode(false);
        renderImage();
        updateHistoryButtons();

        isRestoring = false;
    });
}

function updateHistoryButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

undoBtn.addEventListener("click", () => {
    if (!sourceImage || undoStack.length === 0) return;

    if (textMode) {
        exitTextMode(true);
    }

    redoStack.push(getSnapshot());
    const previousState = undoStack.pop();

    restoreSnapshot(previousState);
});

redoBtn.addEventListener("click", () => {
    if (!sourceImage || redoStack.length === 0) return;

    if (textMode) {
        exitTextMode(true);
    }

    undoStack.push(getSnapshot());
    const nextState = redoStack.pop();

    restoreSnapshot(nextState);
});

resetBtn.addEventListener("click", () => {
    if (!sourceImage || !initialImageDataUrl) return;

    if (textMode) {
        exitTextMode(true);
    }

    saveHistory();

    resetAdjustControls();

    setSourceImage(initialImageDataUrl, () => {
        syncControlsFromState();
        exitCropMode();
        exitTextMode(false);
        renderImage();
        updateHistoryButtons();
    });
});

/* Control sync */

function resetAdjustControls() {
    state.brightness = 0;
    state.contrast = 0;
    state.saturation = 0;
    state.warmth = 0;
    state.shine = 0;
    state.sharpness = 0;
    state.blur = 0;
    state.filter = "none";
    state.textLayers = [];
    state.selectedTextId = null;

    syncControlsFromState();
}

function syncControlsFromState() {
    normalizeState();

    brightnessRange.value = state.brightness;
    contrastRange.value = state.contrast;
    saturationRange.value = state.saturation;
    warmthRange.value = state.warmth;
    shineRange.value = state.shine;
    sharpnessRange.value = state.sharpness;
    blurRange.value = state.blur;

    brightnessValue.textContent = state.brightness;
    contrastValue.textContent = state.contrast;
    saturationValue.textContent = state.saturation;
    warmthValue.textContent = state.warmth;
    shineValue.textContent = state.shine;
    sharpnessValue.textContent = state.sharpness;
    blurValue.textContent = state.blur;

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.filter === state.filter) {
            btn.classList.add("active");
        }
    });

    if (sourceImage) {
        resizeWidth.value = sourceImage.width;
        resizeHeight.value = sourceImage.height;
    }

    updateTextOverlayFromState();
}

/* Adjust */

[
    brightnessRange,
    contrastRange,
    saturationRange,
    warmthRange,
    shineRange,
    sharpnessRange,
    blurRange
].forEach(slider => {
    slider.addEventListener("pointerdown", saveHistory);
});

brightnessRange.addEventListener("input", () => {
    state.brightness = Number(brightnessRange.value);
    brightnessValue.textContent = state.brightness;
    renderImage();
});

contrastRange.addEventListener("input", () => {
    state.contrast = Number(contrastRange.value);
    contrastValue.textContent = state.contrast;
    renderImage();
});

saturationRange.addEventListener("input", () => {
    state.saturation = Number(saturationRange.value);
    saturationValue.textContent = state.saturation;
    renderImage();
});

warmthRange.addEventListener("input", () => {
    state.warmth = Number(warmthRange.value);
    warmthValue.textContent = state.warmth;
    renderImage();
});

shineRange.addEventListener("input", () => {
    state.shine = Number(shineRange.value);
    shineValue.textContent = state.shine;
    renderImage();
});

sharpnessRange.addEventListener("input", () => {
    state.sharpness = Number(sharpnessRange.value);
    sharpnessValue.textContent = state.sharpness;
    renderImage();
});

blurRange.addEventListener("input", () => {
    state.blur = Number(blurRange.value);
    blurValue.textContent = state.blur;
    renderImage();
});

/* Filters */

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!sourceImage) return;

        if (textMode) {
            exitTextMode(true);
        }

        saveHistory();

        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        state.filter = btn.dataset.filter;
        renderImage();
    });
});

/* Tabs */

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

/* Convert */

document.querySelectorAll(".format-option").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".format-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        exportFormat.value = btn.dataset.format;
    });
});

qualityRange.addEventListener("input", () => {
    qualityValue.textContent = `${qualityRange.value}%`;
});

/* Resize */

resizeWidth.addEventListener("input", () => {
    if (!sourceImage || !keepRatio.checked) return;

    const newWidth = Number(resizeWidth.value);
    const ratio = sourceImage.height / sourceImage.width;

    resizeHeight.value = Math.round(newWidth * ratio);
});

resizeHeight.addEventListener("input", () => {
    if (!sourceImage || !keepRatio.checked) return;

    const newHeight = Number(resizeHeight.value);
    const ratio = sourceImage.width / sourceImage.height;

    resizeWidth.value = Math.round(newHeight * ratio);
});

applyResizeBtn.addEventListener("click", () => {
    if (!sourceImage) {
        showUploadRequiredPopup();
        return;
    }

    if (textMode) {
        exitTextMode(true);
    }

    const newWidth = Number(resizeWidth.value);
    const newHeight = Number(resizeHeight.value);

    if (newWidth <= 0 || newHeight <= 0) {
        showInvalidSizePopup();
        return;
    }

    saveHistory();

    const oldWidth = sourceImage.width;
    const oldHeight = sourceImage.height;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    tempCtx.drawImage(sourceImage, 0, 0, newWidth, newHeight);

    state.textLayers.forEach(layer => {
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        const scaleAvg = (scaleX + scaleY) / 2;

        layer.x *= scaleX;
        layer.y *= scaleY;
        layer.size = Math.max(14, Math.round(layer.size * scaleAvg));
    });

    const dataUrl = tempCanvas.toDataURL("image/png", 1.0);

    setSourceImage(dataUrl, () => {
        syncControlsFromState();
        renderImage();
    });
});

/* Transform */

function applyRawTransform(transformType) {
    if (!sourceImage) return;

    if (textMode) {
        exitTextMode(true);
    }

    saveHistory();

    const oldWidth = sourceImage.width;
    const oldHeight = sourceImage.height;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    if (transformType === "rotateLeft" || transformType === "rotateRight") {
        tempCanvas.width = oldHeight;
        tempCanvas.height = oldWidth;

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);

        if (transformType === "rotateLeft") {
            tempCtx.rotate((-90 * Math.PI) / 180);
        } else {
            tempCtx.rotate((90 * Math.PI) / 180);
        }

        tempCtx.drawImage(sourceImage, -oldWidth / 2, -oldHeight / 2);
    }

    if (transformType === "flipX") {
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;

        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(sourceImage, 0, 0);
    }

    if (transformType === "flipY") {
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;

        tempCtx.translate(0, tempCanvas.height);
        tempCtx.scale(1, -1);
        tempCtx.drawImage(sourceImage, 0, 0);
    }

    state.textLayers.forEach(layer => {
        let x = layer.x;
        let y = layer.y;

        if (transformType === "rotateRight") {
            layer.x = oldHeight - y;
            layer.y = x;
        }

        if (transformType === "rotateLeft") {
            layer.x = y;
            layer.y = oldWidth - x;
        }

        if (transformType === "flipX") {
            layer.x = oldWidth - x;
        }

        if (transformType === "flipY") {
            layer.y = oldHeight - y;
        }
    });

    const dataUrl = tempCanvas.toDataURL("image/png", 1.0);

    setSourceImage(dataUrl, () => {
        syncControlsFromState();
        renderImage();
    });
}

rotateLeftBtn.addEventListener("click", () => applyRawTransform("rotateLeft"));
rotateRightBtn.addEventListener("click", () => applyRawTransform("rotateRight"));
flipXBtn.addEventListener("click", () => applyRawTransform("flipX"));
flipYBtn.addEventListener("click", () => applyRawTransform("flipY"));

/* Crop */

startCropBtn.addEventListener("click", () => {
    if (!sourceImage) {
        showUploadRequiredPopup();
        return;
    }

    enterCropMode();
});

function enterCropMode() {
    if (textMode) {
        exitTextMode(true);
    }

    cropMode = true;
    cropOverlay.style.display = "block";
    cropControls.style.display = "grid";

    setTimeout(() => {
        resetCropSelection();
    }, 50);
}

function exitCropMode() {
    cropMode = false;
    cropOverlay.style.display = "none";
    cropControls.style.display = "none";
    cropAction = null;
    cropStart = null;
}

function resetCropSelection() {
    const rect = canvas.getBoundingClientRect();

    const marginX = rect.width * 0.08;
    const marginY = rect.height * 0.08;

    cropRect = {
        x: marginX,
        y: marginY,
        w: rect.width - marginX * 2,
        h: rect.height - marginY * 2
    };

    updateCropBox();
}

function updateCropBox() {
    cropBox.style.left = `${cropRect.x}px`;
    cropBox.style.top = `${cropRect.y}px`;
    cropBox.style.width = `${cropRect.w}px`;
    cropBox.style.height = `${cropRect.h}px`;
}

cropBox.addEventListener("pointerdown", e => {
    if (!cropMode) return;

    e.preventDefault();

    const handle = e.target.dataset.handle;

    cropAction = handle ? `resize-${handle}` : "move";

    cropStart = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        ...cropRect
    };

    cropBox.setPointerCapture(e.pointerId);
});

cropBox.addEventListener("pointermove", e => {
    if (!cropAction || !cropStart) return;

    e.preventDefault();

    const dx = e.clientX - cropStart.pointerX;
    const dy = e.clientY - cropStart.pointerY;

    const canvasRect = canvas.getBoundingClientRect();
    const minSize = 50;

    let x = cropStart.x;
    let y = cropStart.y;
    let w = cropStart.w;
    let h = cropStart.h;

    if (cropAction === "move") {
        x = cropStart.x + dx;
        y = cropStart.y + dy;
    }

    if (cropAction === "resize-tl") {
        x = cropStart.x + dx;
        y = cropStart.y + dy;
        w = cropStart.w - dx;
        h = cropStart.h - dy;
    }

    if (cropAction === "resize-tr") {
        y = cropStart.y + dy;
        w = cropStart.w + dx;
        h = cropStart.h - dy;
    }

    if (cropAction === "resize-bl") {
        x = cropStart.x + dx;
        w = cropStart.w - dx;
        h = cropStart.h + dy;
    }

    if (cropAction === "resize-br") {
        w = cropStart.w + dx;
        h = cropStart.h + dy;
    }

    if (w < minSize) w = minSize;
    if (h < minSize) h = minSize;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (x + w > canvasRect.width) {
        if (cropAction === "move") {
            x = canvasRect.width - w;
        } else {
            w = canvasRect.width - x;
        }
    }

    if (y + h > canvasRect.height) {
        if (cropAction === "move") {
            y = canvasRect.height - h;
        } else {
            h = canvasRect.height - y;
        }
    }

    cropRect = { x, y, w, h };
    updateCropBox();
});

cropBox.addEventListener("pointerup", e => {
    cropAction = null;
    cropStart = null;

    try {
        cropBox.releasePointerCapture(e.pointerId);
    } catch (error) { }
});

cropBox.addEventListener("pointercancel", () => {
    cropAction = null;
    cropStart = null;
});

cancelCropBtn.addEventListener("click", () => {
    exitCropMode();
});

resetCropBtn.addEventListener("click", () => {
    resetCropSelection();
});

applyCropBtn.addEventListener("click", () => {
    if (!sourceImage) return;

    saveHistory();

    const canvasRect = canvas.getBoundingClientRect();

    const scaleX = sourceImage.width / canvasRect.width;
    const scaleY = sourceImage.height / canvasRect.height;

    let sx = Math.round(cropRect.x * scaleX);
    let sy = Math.round(cropRect.y * scaleY);
    let sw = Math.round(cropRect.w * scaleX);
    let sh = Math.round(cropRect.h * scaleY);

    sx = Math.max(0, Math.min(sourceImage.width - 1, sx));
    sy = Math.max(0, Math.min(sourceImage.height - 1, sy));

    sw = Math.max(1, Math.min(sourceImage.width - sx, sw));
    sh = Math.max(1, Math.min(sourceImage.height - sy, sh));

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

    tempCanvas.width = sw;
    tempCanvas.height = sh;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    tempCtx.drawImage(
        sourceImage,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        sw,
        sh
    );

    state.textLayers.forEach(layer => {
        layer.x = Math.max(0, Math.min(sw, layer.x - sx));
        layer.y = Math.max(0, Math.min(sh, layer.y - sy));
    });

    const dataUrl = tempCanvas.toDataURL("image/png", 1.0);

    setSourceImage(dataUrl, () => {
        exitCropMode();
        syncControlsFromState();
        renderImage();
    });
});

/* Text events */

startTextBtn.addEventListener("click", () => {
    enterTextMode();
});

addTextLayerBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    addNewTextLayer();
});

canvas.addEventListener("pointerdown", e => {
    if (!textMode || !sourceImage) return;

    const point = getCanvasPoint(e);
    const clickedLayer = getTextLayerAtPoint(point.x, point.y);

    if (!clickedLayer) return;

    if (clickedLayer.id !== state.selectedTextId) {
        updateSelectedTextFromOverlay();
        state.selectedTextId = clickedLayer.id;
        renderImage();

        setTimeout(() => {
            textEditBox.focus();
            selectEditableText(textEditBox);
        }, 50);
    }
});

function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

textEditBox.addEventListener("input", () => {
    if (!textMode || !sourceImage) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    layer.content = textEditBox.innerText.trim();
    layer.visible = layer.content.length > 0;

    scheduleDraftSave();
});

fontToolBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    if (!textMode) return;

    const isOpen = fontPanel.classList.contains("show");

    fontPanel.classList.toggle("show", !isOpen);
    colorPanel.classList.remove("show");

    fontToolBtn.classList.toggle("active", !isOpen);
    colorToolBtn.classList.remove("active");
});

colorToolBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();

    if (!textMode) return;

    const isOpen = colorPanel.classList.contains("show");

    colorPanel.classList.toggle("show", !isOpen);
    fontPanel.classList.remove("show");

    colorToolBtn.classList.toggle("active", !isOpen);
    fontToolBtn.classList.remove("active");
});

boldToolBtn.addEventListener("click", () => {
    if (!textMode) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    layer.bold = !layer.bold;
    updateTextOverlayFromState();
});

fontChips.forEach(chip => {
    chip.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        if (!textMode) return;

        const layer = getSelectedTextLayer();
        if (!layer) return;

        layer.fontFamily = chip.dataset.font;
        updateTextOverlayFromState();
    });
});

colorDots.forEach(dot => {
    dot.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        if (!textMode) return;

        const layer = getSelectedTextLayer();
        if (!layer) return;

        layer.color = dot.dataset.color;
        updateTextOverlayFromState();
    });
});

textDoneBtn.addEventListener("click", () => {
    if (!sourceImage) return;

    exitTextMode(true);
    renderImage();
    scheduleDraftSave();
});

deleteTextBtn.addEventListener("click", () => {
    if (!textMode || !sourceImage) return;

    const index = state.textLayers.findIndex(layer => layer.id === state.selectedTextId);

    if (index !== -1) {
        state.textLayers.splice(index, 1);
    }

    if (state.textLayers.length > 0) {
        state.selectedTextId = state.textLayers[state.textLayers.length - 1].id;
        renderImage();
        updateTextOverlayFromState();
    } else {
        state.selectedTextId = null;
        exitTextMode(true);
        renderImage();
    }

    scheduleDraftSave();
});

textEditWrap.addEventListener("pointerdown", e => {
    if (!textMode || !sourceImage) return;

    if (e.target === textResizeHandle || e.target === textEditBox) return;

    e.preventDefault();

    const layer = getSelectedTextLayer();
    if (!layer) return;

    const { scaleX, scaleY } = getDisplayScale();

    textDrag = {
        startX: e.clientX,
        startY: e.clientY,
        startTextX: layer.x,
        startTextY: layer.y,
        scaleX,
        scaleY
    };

    textEditWrap.setPointerCapture(e.pointerId);
});

textEditBox.addEventListener("pointerdown", e => {
    if (!textMode || !sourceImage) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    const { scaleX, scaleY } = getDisplayScale();

    textDrag = {
        startX: e.clientX,
        startY: e.clientY,
        startTextX: layer.x,
        startTextY: layer.y,
        scaleX,
        scaleY,
        moved: false
    };

    textEditWrap.setPointerCapture(e.pointerId);
});

textEditWrap.addEventListener("pointermove", e => {
    if (!textDrag || !textMode) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    const rawDx = e.clientX - textDrag.startX;
    const rawDy = e.clientY - textDrag.startY;

    if (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3) {
        textDrag.moved = true;
    }

    if (!textDrag.moved) return;

    e.preventDefault();

    const dx = rawDx / textDrag.scaleX;
    const dy = rawDy / textDrag.scaleY;

    layer.x = Math.max(0, Math.min(canvas.width, textDrag.startTextX + dx));
    layer.y = Math.max(0, Math.min(canvas.height, textDrag.startTextY + dy));

    updateTextOverlayFromState();
});

textEditWrap.addEventListener("pointerup", e => {
    const wasMoved = textDrag && textDrag.moved;

    textDrag = null;

    try {
        textEditWrap.releasePointerCapture(e.pointerId);
    } catch (error) { }

    if (!wasMoved) {
        textEditBox.focus();
    }

    scheduleDraftSave();
});

textEditWrap.addEventListener("pointercancel", () => {
    textDrag = null;
});

textResizeHandle.addEventListener("pointerdown", e => {
    if (!textMode || !sourceImage) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    e.preventDefault();
    e.stopPropagation();

    const { scaleX } = getDisplayScale();

    textResize = {
        startX: e.clientX,
        startSize: layer.size,
        scaleX
    };

    textResizeHandle.setPointerCapture(e.pointerId);
});

textResizeHandle.addEventListener("pointermove", e => {
    if (!textResize || !textMode) return;

    const layer = getSelectedTextLayer();
    if (!layer) return;

    e.preventDefault();

    const dx = (e.clientX - textResize.startX) / textResize.scaleX;

    layer.size = Math.max(14, Math.min(260, Math.round(textResize.startSize + dx)));

    updateTextOverlayFromState();
});

textResizeHandle.addEventListener("pointerup", e => {
    textResize = null;

    try {
        textResizeHandle.releasePointerCapture(e.pointerId);
    } catch (error) { }

    scheduleDraftSave();
});

textResizeHandle.addEventListener("pointercancel", () => {
    textResize = null;
});

/* Export */

/* Export Preview + Confirm */

exportTopBtn.addEventListener("click", async () => {
    if (!sourceImage) {
        showToast("Please upload an image first.");
        return;
    }

    try {
        showToast("Preparing export...");

        if (textMode) {
            exitTextMode(true);
            renderImage();
        }

        const exportData = await createExportBlob();

        pendingExportBlob = exportData.blob;
        pendingExportFileName = exportData.fileName;

        if (pendingExportUrl) {
            URL.revokeObjectURL(pendingExportUrl);
        }

        pendingExportUrl = URL.createObjectURL(pendingExportBlob);

        exportPreviewImg.src = pendingExportUrl;

        exportMetaText.innerHTML = `
      Format: <b>${exportData.formatName}</b><br>
      Size: <b>${formatFileSize(pendingExportBlob.size)}</b><br>
      Resolution: <b>${canvas.width} × ${canvas.height}px</b><br>
      Quality: <b>${exportData.qualityPercent}%</b>
    `;

        exportModal.classList.add("show");
    } catch (error) {
        console.log(error);
        showToast("Export preview failed.");
    }
});

exportConfirmBtn.addEventListener("click", () => {
    if (!pendingExportBlob || !pendingExportUrl) {
        showToast("No export file ready.");
        return;
    }

    const a = document.createElement("a");
    a.href = pendingExportUrl;
    a.download = pendingExportFileName;
    a.click();

    closeExportModal();
    showToast("Image exported successfully.");
});

exportCancelBtn.addEventListener("click", () => {
    closeExportModal();
});

exportModal.addEventListener("click", e => {
    if (e.target === exportModal) {
        closeExportModal();
    }
});

function closeExportModal() {
    exportModal.classList.remove("show");

    if (pendingExportUrl) {
        URL.revokeObjectURL(pendingExportUrl);
    }

    pendingExportBlob = null;
    pendingExportUrl = "";
    pendingExportFileName = "";
    exportPreviewImg.src = "";
}

function createExportBlob() {
    return new Promise((resolve, reject) => {
        const format = exportFormat.value;
        const quality = Number(qualityRange.value) / 100;
        const qualityPercent = Number(qualityRange.value);

        const exportCanvas = document.createElement("canvas");
        const exportCtx = exportCanvas.getContext("2d", { willReadFrequently: true });

        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;

        if (format === "image/jpeg") {
            exportCtx.fillStyle = "#ffffff";
            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        exportCtx.drawImage(canvas, 0, 0);

        exportCanvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Blob creation failed."));
                return;
            }

            const extension = getExtension(format);
            const name = fileName.value.trim() || "edited-image";

            resolve({
                blob,
                fileName: `${name}.${extension}`,
                formatName: getFormatName(format),
                qualityPercent
            });
        }, format, quality);
    });
}

function getFormatName(format) {
    if (format === "image/png") return "PNG";
    if (format === "image/jpeg") return "JPG";
    if (format === "image/webp") return "WEBP";
    return "PNG";
}

function getExtension(format) {
    if (format === "image/png") return "png";
    if (format === "image/jpeg") return "jpg";
    if (format === "image/webp") return "webp";
    return "png";
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

function getExtension(format) {
    if (format === "image/png") return "png";
    if (format === "image/jpeg") return "jpg";
    if (format === "image/webp") return "webp";
    return "png";
}

/* IndexedDB */

const DB_NAME = "Pix EditorDB";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_ID = "last-project";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

async function saveDraftNow() {
    if (!sourceImage || !sourceImageDataUrl) return;

    try {
        const db = await openDB();

        const draft = {
            sourceImageDataUrl,
            initialImageDataUrl,
            state: JSON.parse(JSON.stringify(state)),
            savedAt: Date.now()
        };

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        store.put(draft, DRAFT_ID);
    } catch (error) {
        console.log("Draft save failed:", error);
    }
}

function scheduleDraftSave() {
    if (!sourceImage) return;

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveDraftNow();
    }, 400);
}

async function loadDraft() {
    try {
        const db = await openDB();

        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(DRAFT_ID);

            request.onsuccess = function () {
                resolve(request.result || null);
            };

            request.onerror = function () {
                resolve(null);
            };
        });
    } catch (error) {
        return null;
    }
}

async function deleteDraft() {
    try {
        const db = await openDB();

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        store.delete(DRAFT_ID);
    } catch (error) {
        console.log("Draft delete failed:", error);
    }
}

async function checkForDraftOnStart() {
    const draft = await loadDraft();

    if (draft) {
        pendingRestoreData = draft;
        restoreBox.style.display = "block";
    }
}

restoreYesBtn.addEventListener("click", () => {
    if (!pendingRestoreData) return;

    initialImageDataUrl = pendingRestoreData.initialImageDataUrl || pendingRestoreData.sourceImageDataUrl;
    state = JSON.parse(JSON.stringify(pendingRestoreData.state));
    normalizeState();

    setSourceImage(pendingRestoreData.sourceImageDataUrl, () => {
        syncControlsFromState();

        uploadBox.style.display = "none";
        restoreBox.style.display = "none";
        changeImageBtn.style.display = "block";

        undoStack = [];
        redoStack = [];
        updateHistoryButtons();

        renderImage();
    });
});

const FILTER_PRESETS = {
    none: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        warmth: 0,
        shine: 0,
        sharpness: 0,
        blur: 0,
        grain: 0,
        fade: 0,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    softPortrait: {
        brightness: 6,
        contrast: -6,
        saturation: 6,
        warmth: 10,
        shine: 22,
        sharpness: -6,
        blur: 0,
        grain: 0,
        fade: 6,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    creamyPortrait: {
        brightness: 9,
        contrast: -10,
        saturation: 5,
        warmth: 14,
        shine: 18,
        sharpness: -8,
        blur: 0,
        grain: 0,
        fade: 10,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 5,
        matte: 4
    },

    cinematic: {
        brightness: -4,
        contrast: 18,
        saturation: 8,
        warmth: -10,
        shine: 8,
        sharpness: 8,
        blur: 0,
        grain: 6,
        fade: 0,
        vignette: 24,
        sepia: false,
        bw: false,
        coolBoost: 8,
        vintageTone: 0,
        matte: 0
    },

    moodyDark: {
        brightness: -14,
        contrast: 24,
        saturation: -4,
        warmth: -8,
        shine: -8,
        sharpness: 10,
        blur: 0,
        grain: 8,
        fade: 0,
        vignette: 28,
        sepia: false,
        bw: false,
        coolBoost: 8,
        vintageTone: 0,
        matte: 0
    },

    dreamyRetro: {
        brightness: 8,
        contrast: -10,
        saturation: 6,
        warmth: 16,
        shine: 26,
        sharpness: -10,
        blur: 1,
        grain: 8,
        fade: 12,
        vignette: 8,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 10,
        matte: 0
    },

    vintageFilm: {
        brightness: 4,
        contrast: -4,
        saturation: -10,
        warmth: 22,
        shine: 8,
        sharpness: -3,
        blur: 0,
        grain: 16,
        fade: 14,
        vignette: 14,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 18,
        matte: 0
    },

    goldenHour: {
        brightness: 10,
        contrast: 4,
        saturation: 10,
        warmth: 30,
        shine: 20,
        sharpness: 2,
        blur: 0,
        grain: 2,
        fade: 4,
        vignette: 6,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 8,
        matte: 0
    },

    festivalWarm: {
        brightness: 12,
        contrast: 8,
        saturation: 16,
        warmth: 24,
        shine: 30,
        sharpness: 4,
        blur: 0,
        grain: 0,
        fade: 2,
        vignette: 4,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 6,
        matte: 0
    },

    coolBlue: {
        brightness: 2,
        contrast: 8,
        saturation: -4,
        warmth: -24,
        shine: 8,
        sharpness: 4,
        blur: 0,
        grain: 0,
        fade: 0,
        vignette: 8,
        sepia: false,
        bw: false,
        coolBoost: 20,
        vintageTone: 0,
        matte: 0
    },

    nightBlue: {
        brightness: -10,
        contrast: 16,
        saturation: -8,
        warmth: -32,
        shine: -4,
        sharpness: 6,
        blur: 0,
        grain: 6,
        fade: 0,
        vignette: 30,
        sepia: false,
        bw: false,
        coolBoost: 30,
        vintageTone: 0,
        matte: 0
    },

    greenFilm: {
        brightness: 4,
        contrast: -4,
        saturation: -8,
        warmth: -6,
        shine: 2,
        sharpness: -2,
        blur: 0,
        grain: 12,
        fade: 12,
        vignette: 10,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: -6,
        matte: 8
    },

    retroOrange: {
        brightness: 6,
        contrast: 2,
        saturation: 6,
        warmth: 28,
        shine: 10,
        sharpness: 0,
        blur: 0,
        grain: 10,
        fade: 10,
        vignette: 10,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 22,
        matte: 0
    },

    cleanBright: {
        brightness: 12,
        contrast: 6,
        saturation: 8,
        warmth: 4,
        shine: 18,
        sharpness: 10,
        blur: 0,
        grain: 0,
        fade: 0,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    animePop: {
        brightness: 10,
        contrast: 20,
        saturation: 28,
        warmth: 2,
        shine: 14,
        sharpness: 18,
        blur: 0,
        grain: 0,
        fade: 0,
        vignette: 4,
        sepia: false,
        bw: false,
        coolBoost: 4,
        vintageTone: 0,
        matte: 0
    },

    bw: {
        brightness: 0,
        contrast: 14,
        saturation: -100,
        warmth: 0,
        shine: 2,
        sharpness: 8,
        blur: 0,
        grain: 8,
        fade: 0,
        vignette: 10,
        sepia: false,
        bw: true,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    noir: {
        brightness: -8,
        contrast: 32,
        saturation: -100,
        warmth: -4,
        shine: -8,
        sharpness: 16,
        blur: 0,
        grain: 14,
        fade: 0,
        vignette: 34,
        sepia: false,
        bw: true,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    sepia: {
        brightness: 4,
        contrast: 6,
        saturation: -12,
        warmth: 18,
        shine: 6,
        sharpness: 0,
        blur: 0,
        grain: 4,
        fade: 6,
        vignette: 8,
        sepia: true,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    oldPhoto: {
        brightness: 2,
        contrast: -8,
        saturation: -18,
        warmth: 14,
        shine: -8,
        sharpness: -4,
        blur: 1,
        grain: 18,
        fade: 16,
        vignette: 16,
        sepia: true,
        bw: false,
        coolBoost: 0,
        vintageTone: 8,
        matte: 10
    },

    highContrast: {
        brightness: 0,
        contrast: 28,
        saturation: 12,
        warmth: 0,
        shine: 6,
        sharpness: 16,
        blur: 0,
        grain: 0,
        fade: 0,
        vignette: 6,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 0
    },

    fadeMatte: {
        brightness: 10,
        contrast: -18,
        saturation: -10,
        warmth: 4,
        shine: -10,
        sharpness: -6,
        blur: 0,
        grain: 4,
        fade: 22,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 0,
        matte: 16
    },

    softFade: {
        brightness: 8,
        contrast: -14,
        saturation: -6,
        warmth: 8,
        shine: 4,
        sharpness: -12,
        blur: 1,
        grain: 2,
        fade: 20,
        vignette: 0,
        sepia: false,
        bw: false,
        coolBoost: 0,
        vintageTone: 4,
        matte: 12
    },

    cyberpunk: {
        brightness: 2,
        contrast: 24,
        saturation: 30,
        warmth: -18,
        shine: 18,
        sharpness: 18,
        blur: 0,
        grain: 4,
        fade: 0,
        vignette: 18,
        sepia: false,
        bw: false,
        coolBoost: 28,
        vintageTone: 0,
        matte: 0
    }
};

restoreNoBtn.addEventListener("click", async () => {
    pendingRestoreData = null;
    restoreBox.style.display = "none";
    await deleteDraft();
});

checkForDraftOnStart();

/* Enhanced App Popups */

function showAppPopup({
    icon = "⚠️",
    title = "Notice",
    message = "",
    buttonText = "OK",
    action = null
}) {
    appPopupIcon.textContent = icon;
    appPopupTitle.textContent = title;
    appPopupMessage.textContent = message;
    appPopupActionBtn.textContent = buttonText;
    appPopupAction = action;

    appPopup.classList.add("show");
}

function closeAppPopup() {
    appPopup.classList.remove("show");
    appPopupAction = null;
}

appPopupActionBtn.addEventListener("click", () => {
    const action = appPopupAction;
    closeAppPopup();

    if (typeof action === "function") {
        action();
    }
});

appPopupCloseBtn.addEventListener("click", closeAppPopup);

appPopup.addEventListener("click", e => {
    if (e.target === appPopup) {
        closeAppPopup();
    }
});

function showUploadRequiredPopup() {
    showAppPopup({
        icon: "🖼️",
        title: "Add an image first",
        message: "Please upload an image before using this tool.",
        buttonText: "Upload Image",
        action: () => fileInput.click()
    });
}

function showInvalidSizePopup() {
    showAppPopup({
        icon: "📐",
        title: "Invalid size",
        message: "Please enter a valid width and height before resizing.",
        buttonText: "OK"
    });
}

/* PWA Install Popup */

function isPwaInstalled() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

function updateInstallButtonVisibility() {
    if (!installBtn) return;

    if (isPwaInstalled()) {
        installBtn.classList.remove("show");
        return;
    }

    if (deferredInstallPrompt) {
        installBtn.classList.add("show");
    } else {
        installBtn.classList.remove("show");
    }
}

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();

    deferredInstallPrompt = event;
    updateInstallButtonVisibility();
});

installBtn.addEventListener("click", () => {
    if (isPwaInstalled()) {
        installBtn.classList.remove("show");
        return;
    }

    if (!deferredInstallPrompt) {
        showAppPopup({
            icon: "📱",
            title: "Install not ready",
            message: "Open this app on Chrome mobile or make sure PWA files are loaded properly.",
            buttonText: "OK"
        });
        return;
    }

    installModal.classList.add("show");
});

function closeInstallModal() {
    installModal.classList.remove("show");
}

installNowBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
        closeInstallModal();

        showAppPopup({
            icon: "📱",
            title: "Install not available",
            message: "The browser install option is not available right now.",
            buttonText: "OK"
        });

        return;
    }

    // First close our custom popup
    closeInstallModal();

    // Wait a little so our popup disappears before browser popup opens
    await new Promise(resolve => setTimeout(resolve, 250));

    // Now open real browser install popup
    deferredInstallPrompt.prompt();

    const choice = await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;

    if (choice.outcome === "accepted") {
        installBtn.classList.remove("show");

        showAppPopup({
            icon: "🎉",
            title: "Pix Editor installed",
            message: "The app was added to your device successfully.",
            buttonText: "Done"
        });
    } else {
        showAppPopup({
            icon: "ℹ️",
            title: "Install cancelled",
            message: "You can install Pix Editor later from the install button.",
            buttonText: "OK"
        });
    }

    updateInstallButtonVisibility();
});

installLaterBtn.addEventListener("click", closeInstallModal);

installCloseBtn.addEventListener("click", closeInstallModal);

installModal.addEventListener("click", e => {
    if (e.target === installModal) {
        closeInstallModal();
    }
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn.classList.remove("show");

    showAppPopup({
        icon: "🎉",
        title: "Installed successfully",
        message: "Pix Editor is ready to use like a mobile app.",
        buttonText: "Done"
    });
});

updateInstallButtonVisibility();

/* PWA */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js");
    });
}

function isPwaInstalled() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

function updateInstallButtonVisibility() {
    if (isPwaInstalled()) {
        installBtn.classList.remove("show");
        return;
    }

    if (deferredInstallPrompt) {
        installBtn.classList.add("show");
    } else {
        installBtn.classList.remove("show");
    }
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();

    deferredInstallPrompt = event;

    updateInstallButtonVisibility();
});

installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
        showToast("Install option is not available yet.");
        return;
    }

    deferredInstallPrompt.prompt();

    const choice = await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;

    if (choice.outcome === "accepted") {
        installBtn.classList.remove("show");
        showToast("App installed successfully.");
    } else {
        showToast("Install cancelled.");
    }
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn.classList.remove("show");
    showToast("PixConvert installed.");
});

updateInstallButtonVisibility();