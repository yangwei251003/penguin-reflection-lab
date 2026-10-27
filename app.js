(() => {
  const dreamInput = document.querySelector("[data-role='dream-input']");
  const analyzeBtn = document.querySelector("[data-role='analyze']");
  const clearBtn = document.querySelector("[data-role='clear']");
  const chips = document.querySelectorAll("[data-role='chip']");
  const resultsSection = document.querySelector("[data-role='results']");
  const decodeEl = document.querySelector("[data-role='decode']");
  const anxietyEl = document.querySelector("[data-role='anxiety']");
  const planEl = document.querySelector("[data-role='plan']");
  const quoteEl = document.querySelector("[data-role='quote']");
  const tipEl = document.querySelector("[data-role='tip']");
  const runtime = window.PENGUIN_RUNTIME || { cloudEnabled: false };
  const cloudEnabled = runtime.cloudEnabled === true;
  const consent = document.querySelector("[data-role='cloud-consent']");
  const consentBox = document.querySelector("[data-role='private-consent']");
  if (consentBox) consentBox.hidden = !cloudEnabled;
  if (cloudEnabled) {
    const notice = document.querySelector('.demo-notice');
    if (notice) notice.textContent = '个人模型模式 · 仅使用合成内容 · 明确勾选后才会外发 · 非心理评估或诊断';
  }
  const steps = Array.from(document.querySelectorAll("[data-role='step']"));

  if (!dreamInput || !analyzeBtn || !resultsSection) {
    return;
  }

  let busy = false;
  resultsSection.hidden = true;

  const topicRules = [
    {
      keywords: ["plc", "梯形", "逻辑", "继电", "ladder"],
      topic: "PLC 与逻辑控制",
      anxiety: "示例关注点：PLC扫描顺序与互锁逻辑。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "复习 PLC 扫描周期与互锁逻辑",
        "完成 3 组梯形图故障诊断案例",
        "模拟 2 次现场报警处理流程"
      ]
    },
    {
      keywords: ["运放", "模拟", "放大", "噪声", "饱和", "电路"],
      topic: "模拟电路与仪表",
      anxiety: "示例关注点：模拟电路稳定性与测量练习。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "重新推导 2 个经典运放电路",
        "完成 2 次实验调试记录并总结噪声来源",
        "设计 1 个低通滤波器并进行仿真"
      ]
    },
    {
      keywords: ["电机", "转速", "失控", "电力", "负载", "传动"],
      topic: "电机与电力系统",
      anxiety: "示例关注点：电机启动与保护的课程复习。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "梳理电机启动与保护流程",
        "列出 5 个典型故障场景并写出处理步骤",
        "完成 1 次启动过程仿真"
      ]
    },
    {
      keywords: ["fpga", "时序", "逻辑门", "verilog", "数字", "数电"],
      topic: "数字系统与 FPGA",
      anxiety: "示例关注点：数字系统时序与自测。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "回顾时序分析与时钟约束",
        "完成 2 个小型模块设计并自测",
        "整理一次综合失败的复盘报告"
      ]
    },
    {
      keywords: ["信号", "频域", "滤波", "傅里叶", "dsp"],
      topic: "信号与系统",
      anxiety: "示例关注点：信号与频域练习。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "完成 2 次频域分析练习",
        "手算 1 组傅里叶变换并验证",
        "进行 1 次滤波器仿真"
      ]
    },
    {
      keywords: ["单片机", "嵌入式", "mcu", "arm", "串口"],
      topic: "嵌入式与控制",
      anxiety: "示例关注点：嵌入式初始化与调试记录。这是固定词表匹配，不代表真实心理原因。",
      plan: [
        "梳理外设初始化流程",
        "完成 2 次调试日志分析",
        "实现 1 个稳定的采样闭环控制"
      ]
    }
  ];

  const fallbackTopic = {
    topic: "电气工程综合能力",
    anxiety: "示例关注点：综合课程的练习安排。这是固定词表匹配，不代表真实心理原因。",
    plan: [
      "复盘最近一门课程的薄弱点",
      "完成 2 次专项练习并总结错误",
      "制定一周的复习节奏与打卡计划"
    ]
  };

  const symbolRules = [
    { keywords: ["火", "燃", "爆", "烧"], hint: "把火或爆炸作为复盘出错情节的创作提示" },
    { keywords: ["水", "淹", "溺", "下沉"], hint: "把水作为整理任务清单的创作提示" },
    { keywords: ["云", "雾", "模糊"], hint: "把云雾作为梳理知识结构的创作提示" },
    { keywords: ["考试", "答辩", "面试", "评审", "演示"], hint: "把评估场景作为复习与演练的创作提示" },
    { keywords: ["报警", "红灯", "闪烁"], hint: "把报警作为检查调试流程的创作提示" }
  ];

  function findTopic(text) {
    const lowered = text.toLowerCase();
    for (const rule of topicRules) {
      if (rule.keywords.some((word) => lowered.includes(word))) {
        return rule;
      }
    }
    return fallbackTopic;
  }

  function findSymbolHints(text) {
    return symbolRules
      .filter((rule) => rule.keywords.some((word) => text.includes(word)))
      .map((rule) => rule.hint);
  }

  function buildDecode(text, topic) {
    const hints = findSymbolHints(text);
    const mechanisms = ["象征"];
    if (/考试|答辩|面试|评审|演示/.test(text)) {
      mechanisms.push("位移");
    }
    if (hints.length >= 2) {
      mechanisms.push("凝缩");
    }
    const mechanismText = Array.from(new Set(mechanisms)).join("、");
    const hintText = hints.length ? `预设创作提示：${hints.join("；")}。` : "这是没有匹配到特定词条时的固定写作示例。";
    return `${hintText}本示例用“${mechanismText}”等历史叙事标签组织“${topic.topic}”的课程联想，不推断真实心理状态。`;
  }

  function buildQuote(topic) {
    return `企鹅教授：这只是关于 ${topic.topic} 的学习联想。你可以自主选择一项小练习，而无需把结果当成心理结论。`;
  }

  function resetSteps() {
    steps.forEach((step) => {
      step.classList.remove("is-active", "is-done");
    });
  }

  function runStepAnimation() {
    return new Promise((resolve) => {
      let stepIndex = 0;
      const tick = () => {
        if (stepIndex < steps.length) {
          steps.forEach((step, index) => {
            step.classList.toggle("is-active", index === stepIndex);
            step.classList.toggle("is-done", index < stepIndex);
          });
          stepIndex += 1;
          setTimeout(tick, 420);
        } else {
          steps.forEach((step) => {
            step.classList.remove("is-active");
            step.classList.add("is-done");
          });
          resolve();
        }
      };
      tick();
    });
  }

  async function fetchAnalysis(text) {
    if (!cloudEnabled || !consent || !consent.checked) throw new Error('未明确启用个人合成内容外发');
    const endpoint = new URL(runtime.endpoint || 'api/interpret', window.location.href);
    if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.origin !== window.location.origin) throw new Error('仅允许自己配置的同源后端');
    const response = await fetch(endpoint.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dream: text })
    });
    if (!response.ok) {
      throw new Error("接口响应失败");
    }
    return response.json();
  }

  function normalizePlan(plan) {
    if (Array.isArray(plan)) return plan.filter((item) => typeof item === "string").slice(0, 8);
    if (typeof plan === "string") {
      return plan
        .split(/\n|；|;|、|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  async function runAnalysis() {
    if (busy) return;
    const text = dreamInput.value.trim();
    if (!text) {
      if (tipEl) {
        tipEl.textContent = "请先输入虚构练习场景。";
      }
      return;
    }

    if (text.length > 2000) { if (tipEl) tipEl.textContent = '合成示例请保持在2000字以内。'; return; }
    if (cloudEnabled && (!consent || !consent.checked)) { if (tipEl) tipEl.textContent = '个人模型模式须先勾选仅发送合成内容；不发送真实心情、联系方式或私人资料。'; return; }
    busy = true; analyzeBtn.disabled = true; if (clearBtn) clearBtn.disabled = true;
    try {
    resetSteps();
    if (tipEl) {
      tipEl.textContent = "正在整理课程联想示例；动画仅展示本机流程...";
    }

    const stepPromise = runStepAnimation();
    let apiResult = null;
    try {
      if (cloudEnabled) apiResult = await fetchAnalysis(text);
    } catch (error) {
      apiResult = null;
    }

    await stepPromise;

    let decode = "";
    let anxiety = "";
    let plan = [];
    let quote = "";

    if (apiResult && apiResult.decode) {
      decode = apiResult.decode;
      anxiety = apiResult.anxiety || "";
      plan = normalizePlan(apiResult.plan);
      quote = apiResult.quote || "企鹅教授：我们先从整理梦境细节开始。";
    } else {
      const topic = findTopic(text);
      decode = buildDecode(text, topic);
      anxiety = topic.anxiety;
      plan = topic.plan;
      quote = buildQuote(topic);
      if (tipEl) {
        tipEl.textContent = cloudEnabled ? "自配模型请求未成功，当前展示本机规则；外部请求可能已发送。" : "当前为本机规则演示，不是模型判断或心理结论；本网页不保存输入。";
      }
    }

    if (decodeEl) decodeEl.textContent = decode;
    if (anxietyEl) anxietyEl.textContent = anxiety;
    if (planEl) {
      const items = plan.map((item) => { const li = document.createElement('li'); li.textContent = String(item); return li; });
      planEl.replaceChildren(...items);
    }
    if (quoteEl) quoteEl.textContent = quote;
    resultsSection.hidden = false;
    resultsSection.classList.add("is-visible");
    resultsSection.dataset.resultMode = apiResult ? "configured-provider-unverified" : "offline-rules";
    if (tipEl && apiResult && apiResult.decode) {
      tipEl.textContent = "这是自配外部模型输出，未经事实或医学验证；仅作合成内容的学习/写作联想。";
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    } finally { busy = false; analyzeBtn.disabled = false; if (clearBtn) clearBtn.disabled = false; }
  }

  analyzeBtn.addEventListener("click", runAnalysis);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      dreamInput.value = "";
      resultsSection.hidden = true;
      if (decodeEl) decodeEl.textContent = '';
      if (anxietyEl) anxietyEl.textContent = '';
      if (planEl) planEl.replaceChildren();
      if (quoteEl) quoteEl.textContent = '';
      resultsSection.classList.remove("is-visible");
      resetSteps();
      if (consent) consent.checked = false;
      if (tipEl) {
        tipEl.textContent = "只用虚构内容；规则不推断真实心理状态。";
      }
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (busy) return;
      const sample = chip.getAttribute("data-dream");
      if (sample) {
        dreamInput.value = sample;
        dreamInput.focus();
      }
    });
  });
})();
