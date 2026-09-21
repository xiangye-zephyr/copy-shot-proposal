// Segment navigation, copy/shot views, and reference-image preview.
(function () {
  "use strict";

  const data = window.HOKA_CONSOLE_DATA;
  const segments = data.segments;

  const elements = {
    body: document.body,
    stage: document.getElementById("stage"),
    copyBoard: document.getElementById("copyBoard"),
    navigation: document.getElementById("segmentNavigation"),
    chapterMap: document.getElementById("chapterMap"),
    timeline: document.getElementById("timeline"),
    railCount: document.getElementById("railCount"),
    segmentCode: document.getElementById("segmentCode"),
    chapterName: document.getElementById("chapterName"),
    timecode: document.getElementById("timecode"),
    scriptPanel: document.querySelector(".script-panel"),
    scriptText: document.getElementById("scriptText"),
    scriptCorner: document.querySelector(".script-corner"),
    analysisChapter: document.getElementById("analysisChapter"),
    analysisSegment: document.getElementById("analysisSegment"),
    structureList: document.getElementById("structureList"),
    writingIdea: document.getElementById("writingIdea"),
    shotKey: document.getElementById("shotKey"),
    shotSequence: document.getElementById("shotSequence"),
    mainImage: document.getElementById("mainImage"),
    alternateImage: document.getElementById("alternateImage"),
    tertiaryImage: document.getElementById("tertiaryImage"),
    mainCaption: document.getElementById("mainCaption"),
    alternateCaption: document.getElementById("alternateCaption"),
    tertiaryCaption: document.getElementById("tertiaryCaption"),
    cueText: document.getElementById("cueText"),
    editText: document.getElementById("editText"),
    mainSource: document.getElementById("mainSource"),
    alternateSource: document.getElementById("alternateSource"),
    tertiarySource: document.getElementById("tertiarySource"),
    mainLink: document.getElementById("mainLink"),
    alternateLink: document.getElementById("alternateLink"),
    tertiaryLink: document.getElementById("tertiaryLink"),
    mainInternal: document.getElementById("mainInternal"),
    alternateInternal: document.getElementById("alternateInternal"),
    tertiaryInternal: document.getElementById("tertiaryInternal"),
    tertiarySourceCard: document.getElementById("tertiarySourceCard"),
    sourceRail: document.querySelector(".source-rail"),
    sourceType: document.getElementById("sourceType"),
    riskChip: document.getElementById("riskChip"),
    controlNote: document.getElementById("controlNote"),
    transportNumber: document.getElementById("transportNumber"),
    transportTime: document.getElementById("transportTime"),
    previousButton: document.getElementById("previousButton"),
    nextButton: document.getElementById("nextButton"),
    overviewButton: document.getElementById("overviewButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    overviewDialog: document.getElementById("overviewDialog"),
    closeOverview: document.getElementById("closeOverview"),
    hardRule: document.getElementById("hardRule"),
    imageDialog: document.getElementById("imageDialog"),
    closeImage: document.getElementById("closeImage"),
    dialogImage: document.getElementById("dialogImage"),
    dialogCaption: document.getElementById("dialogCaption"),
  };

  const savedSegment = Number(localStorage.getItem("hoka-console-segment"));
  const savedMode = localStorage.getItem("hoka-console-mode");

  let currentIndex = Number.isInteger(savedSegment)
    ? Math.min(Math.max(savedSegment - 1, 0), segments.length - 1)
    : 0;
  let mode = savedMode === "shot" ? "shot" : "copy";
  const rootElement = document.documentElement;
  const requestFullscreen = rootElement.requestFullscreen;
  const exitFullscreen = document.exitFullscreen;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function shortSource(value) {
    if (!value) return "来源待确认";
    const firstSentence = value.split(/[：。]/)[0];
    return firstSentence.length > 34 ? `${firstSentence.slice(0, 34)}…` : firstSentence;
  }

  function riskLevel(value) {
    if (value.startsWith("红")) return "danger";
    if (value.startsWith("绿")) return "clear";
    return "warning";
  }

  function scriptDensity(value) {
    const length = [...value].length;
    if (length >= 46) return "long";
    if (length >= 38) return "medium";
    return "standard";
  }

  function countScriptLines() {
    const range = document.createRange();
    range.selectNodeContents(elements.scriptText);
    const tops = new Set(
      [...range.getClientRects()]
        .filter((rect) => rect.width > 1 && rect.height > 1)
        .map((rect) => Math.round(rect.top)),
    );
    return Math.max(tops.size, 1);
  }

  function fitScriptText() {
    if (mode === "copy") return;
    elements.scriptText.style.fontSize = "";
    let fontSize = Number.parseFloat(
      window.getComputedStyle(elements.scriptText).fontSize,
    );
    let lines = countScriptLines();

    while (window.innerWidth > 900 && lines > 3 && fontSize > 22) {
      fontSize -= 1;
      elements.scriptText.style.fontSize = `${fontSize}px`;
      lines = countScriptLines();
    }

    elements.scriptText.dataset.lines = String(lines);
  }

  function setSourceLink(linkElement, internalElement, source) {
    if (source.link) {
      linkElement.href = source.link;
      linkElement.hidden = false;
      internalElement.hidden = true;
    } else {
      linkElement.removeAttribute("href");
      linkElement.hidden = true;
      internalElement.hidden = false;
    }
  }

  function buildNavigation() {
    elements.navigation.replaceChildren();

    data.chapters.forEach((chapter) => {
      const group = document.createElement("section");
      group.className = "chapter-group";

      const heading = document.createElement("h2");
      heading.className = "chapter-label";
      heading.textContent = `[ ${chapter.label} ]`;
      group.appendChild(heading);

      const list = document.createElement("div");
      list.className = "segment-list";

      segments
        .filter((segment) => segment.chapter === chapter.id)
        .forEach((segment) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "segment-button";
          button.dataset.segment = String(segment.number);
          button.innerHTML = `
            <span class="segment-button-number">${pad(segment.number)}</span>
            <span class="segment-button-time">${segment.time}</span>
          `;
          button.addEventListener("click", () => selectSegment(segment.number - 1, true));
          list.appendChild(button);
        });

      group.appendChild(list);
      elements.navigation.appendChild(group);
    });
  }

  function buildTimeline() {
    elements.timeline.replaceChildren();
    segments.forEach((segment) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-button";
      button.dataset.timelineSegment = String(segment.number);
      button.setAttribute("aria-label", `第${segment.number}段 ${segment.time}`);
      button.title = `第${segment.number}段 ${segment.time}`;
      button.addEventListener("click", () => selectSegment(segment.number - 1, true));
      elements.timeline.appendChild(button);
    });
  }

  function buildCopyBoard() {
    elements.copyBoard.replaceChildren();

    data.chapters.forEach((chapter, chapterIndex) => {
      const section = document.createElement("section");
      section.className = "copy-chapter";

      const heading = document.createElement("header");
      heading.className = "copy-chapter-heading";
      heading.innerHTML = `
        <span>${pad(chapterIndex + 1)} / ${chapter.label}</span>
        <span>SEG ${pad(chapter.range[0])}—${pad(chapter.range[1])}</span>
      `;
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "copy-card-grid";

      segments
        .filter((segment) => segment.chapter === chapter.id)
        .forEach((segment) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "copy-card";
          button.dataset.copySegment = String(segment.number);
          button.innerHTML = `
            <span class="copy-card-meta">
              <b>SEG / ${pad(segment.number)}</b>
              <time>${segment.time}</time>
            </span>
            <span class="copy-card-text">${segment.script}</span>
          `;
          button.addEventListener("click", () => selectSegment(segment.number - 1));
          grid.appendChild(button);
        });

      section.appendChild(grid);
      elements.copyBoard.appendChild(section);
    });
  }

  function buildOverview() {
    elements.chapterMap.replaceChildren();
    data.chapters.forEach((chapter, index) => {
      const count = chapter.range[1] - chapter.range[0] + 1;
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <span>0${index + 1} / ${pad(chapter.range[0])}—${pad(chapter.range[1])}</span>
        <strong>${chapter.label}</strong>
        <span>${count} SEGMENTS</span>
      `;
      button.addEventListener("click", () => {
        elements.overviewDialog.close();
        selectSegment(chapter.range[0] - 1, true);
      });
      elements.chapterMap.appendChild(button);
    });
    elements.hardRule.textContent = data.rule.replace("台词按定稿 Excel 原样引用。", "");
  }

  function renderMode() {
    elements.body.dataset.mode = mode;
    elements.stage.dataset.screenLabel = mode === "copy" ? "文案总览" : "逐段镜头";
    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.modeButton === mode),
      );
    });
    localStorage.setItem("hoka-console-mode", mode);
    window.requestAnimationFrame(fitScriptText);
    if (mode === "copy") {
      window.requestAnimationFrame(() => revealCopySegment(currentIndex + 1));
    }
  }

  function revealCopySegment(number) {
    const target = elements.copyBoard.querySelector(`[data-copy-segment="${number}"]`);
    if (!target) return;
    const boardRect = elements.copyBoard.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - boardRect.top + elements.copyBoard.scrollTop;
    const nextTop = targetTop - elements.copyBoard.clientHeight / 2 + target.clientHeight / 2;
    elements.copyBoard.scrollTo({ top: Math.max(0, nextTop), behavior: "auto" });
  }

  function renderCopyAnalysis(segment) {
    const analysis = data.copyAnalysis?.[segment.number - 1] || {
      structure: ["信息引入", "核心表达", "下文衔接"],
      idea: "保留定稿原意，用简短的结构标签说明这一段如何推进叙事。",
    };

    elements.analysisChapter.textContent = segment.chapterLabel;
    elements.analysisSegment.textContent = `${pad(segment.number)} / 21`;
    elements.structureList.replaceChildren();
    analysis.structure.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      elements.structureList.appendChild(listItem);
    });
    elements.writingIdea.textContent = analysis.idea;
  }

  function renderSegment(revealCopy = false) {
    const segment = segments[currentIndex];
    const number = pad(segment.number);
    const hasTertiary = Boolean(segment.tertiary);

    elements.railCount.textContent = `${number} / 21`;
    elements.segmentCode.textContent = `SEG / ${number}`;
    elements.chapterName.textContent = segment.chapterLabel;
    elements.timecode.textContent = segment.time;
    elements.scriptText.textContent = segment.script;
    elements.scriptText.dataset.density = scriptDensity(segment.script);
    elements.scriptCorner.textContent = number;
    renderCopyAnalysis(segment);
    elements.mainImage.src = segment.main.image;
    elements.mainImage.alt = `第${segment.number}段主选镜头：${shortSource(segment.main.source)}`;
    elements.alternateImage.src = segment.alternate.image;
    elements.alternateImage.alt = `第${segment.number}段备选镜头：${shortSource(segment.alternate.source)}`;
    elements.mainCaption.textContent = shortSource(segment.main.source);
    elements.alternateCaption.textContent = shortSource(segment.alternate.source);
    elements.shotSequence.dataset.count = hasTertiary ? "3" : "2";
    elements.sourceRail.dataset.sourceCount = hasTertiary ? "3" : "2";
    elements.shotKey.innerHTML = hasTertiary
      ? "A 主选&nbsp;&nbsp;/&nbsp;&nbsp;B 补充&nbsp;&nbsp;/&nbsp;&nbsp;C 补充"
      : "A 主选&nbsp;&nbsp;/&nbsp;&nbsp;B 备选";
    document.querySelectorAll(".tertiary-shot").forEach((element) => {
      element.hidden = !hasTertiary;
    });
    elements.tertiarySourceCard.hidden = !hasTertiary;

    if (hasTertiary) {
      elements.tertiaryImage.src = segment.tertiary.image;
      elements.tertiaryImage.alt = `第${segment.number}段线索镜头：${shortSource(segment.tertiary.source)}`;
      elements.tertiaryCaption.textContent = shortSource(segment.tertiary.source);
      elements.tertiarySource.textContent = segment.tertiary.source;
      setSourceLink(
        elements.tertiaryLink,
        elements.tertiaryInternal,
        segment.tertiary,
      );
    } else {
      elements.tertiaryImage.removeAttribute("src");
    }
    elements.cueText.textContent = segment.cue;
    elements.editText.textContent = segment.edit;
    elements.mainSource.textContent = segment.main.source;
    elements.alternateSource.textContent = segment.alternate.source;
    elements.sourceType.textContent = segment.sourceType;
    elements.riskChip.textContent = segment.risk;
    elements.riskChip.dataset.risk = riskLevel(segment.risk);
    elements.controlNote.textContent = segment.note;
    elements.transportNumber.textContent = `${number} / 21`;
    elements.transportTime.textContent = segment.time;

    setSourceLink(elements.mainLink, elements.mainInternal, segment.main);
    setSourceLink(
      elements.alternateLink,
      elements.alternateInternal,
      segment.alternate,
    );

    document.querySelectorAll("[data-segment]").forEach((button) => {
      const isCurrent = Number(button.dataset.segment) === segment.number;
      button.setAttribute("aria-current", String(isCurrent));
      if (isCurrent) {
        const nav = elements.navigation;
        const targetTop = button.offsetTop - nav.clientHeight / 2 + button.clientHeight / 2;
        nav.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
      }
    });

    document.querySelectorAll("[data-timeline-segment]").forEach((button) => {
      const numberValue = Number(button.dataset.timelineSegment);
      button.setAttribute("aria-current", String(numberValue === segment.number));
      button.dataset.past = String(numberValue < segment.number);
    });

    document.querySelectorAll("[data-copy-segment]").forEach((button) => {
      const isCurrent = Number(button.dataset.copySegment) === segment.number;
      button.setAttribute("aria-current", String(isCurrent));
    });

    elements.previousButton.disabled = currentIndex === 0;
    elements.nextButton.disabled = currentIndex === segments.length - 1;
    localStorage.setItem("hoka-console-segment", String(segment.number));
    window.requestAnimationFrame(fitScriptText);
    if (mode === "copy" && revealCopy) {
      window.requestAnimationFrame(() => revealCopySegment(segment.number));
    }
  }

  function selectSegment(index, revealCopy = false) {
    currentIndex = Math.min(Math.max(index, 0), segments.length - 1);
    renderSegment(revealCopy);
  }

  function openImage(kind) {
    const segment = segments[currentIndex];
    const source = segment[kind];
    elements.dialogImage.src = source.image;
    elements.dialogCaption.textContent = source.source;
    elements.imageDialog.showModal();
  }

  document.querySelectorAll("[data-mode-button]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.modeButton;
      renderMode();
    });
  });

  document.querySelectorAll("[data-shot]").forEach((button) => {
    button.addEventListener("click", () => openImage(button.dataset.shot));
  });

  elements.previousButton.addEventListener("click", () => selectSegment(currentIndex - 1, true));
  elements.nextButton.addEventListener("click", () => selectSegment(currentIndex + 1, true));
  elements.overviewButton.addEventListener("click", () => elements.overviewDialog.showModal());
  elements.closeOverview.addEventListener("click", () => elements.overviewDialog.close());
  elements.closeImage.addEventListener("click", () => elements.imageDialog.close());

  if (!requestFullscreen || !exitFullscreen) {
    elements.fullscreenButton.hidden = true;
  } else {
    elements.fullscreenButton.addEventListener("click", async () => {
      if (document.fullscreenElement) {
        await exitFullscreen.call(document);
      } else {
        await requestFullscreen.call(rootElement);
      }
    });
  }

  const updateFullscreenLabel = () => {
    elements.fullscreenButton.textContent =
      document.fullscreenElement ? "[ 退出全屏 ]" : "[ 全屏 ]";
  };
  document.addEventListener("fullscreenchange", updateFullscreenLabel);

  document.addEventListener("keydown", (event) => {
    const tagName = event.target.tagName;
    if (["INPUT", "TEXTAREA"].includes(tagName)) return;
    if (event.key === "ArrowLeft") selectSegment(currentIndex - 1, true);
    if (event.key === "ArrowRight") selectSegment(currentIndex + 1, true);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fitScriptText, 80);
  });

  [elements.overviewDialog, elements.imageDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  buildNavigation();
  buildTimeline();
  buildCopyBoard();
  buildOverview();
  renderMode();
  renderSegment();
})();
