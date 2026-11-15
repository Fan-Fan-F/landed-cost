// LandedCost — 跨境落地成本计算
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => "¥" + n.toFixed(2);

  // 初始化下拉框
  $("#country").innerHTML = Object.entries(COUNTRIES)
    .map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");
  $("#category").innerHTML = Object.entries(CATEGORIES)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("#channel").innerHTML = Object.entries(CHANNELS)
    .map(([k, v]) => `<option value="${k}">${v.name}（${v.eta}）</option>`).join("");
  $("#country").value = "US";

  function calculate() {
    const country = COUNTRIES[$("#country").value];
    const cat = $("#category").value;
    const channel = CHANNELS[$("#channel").value];
    const fx = FX[$("#currency").value];
    const qty = Math.max(1, +$("#qty").value || 1);
    const priceCNY = (+$("#price").value || 0) * fx;
    const weight = Math.max(0.01, +$("#weight").value || 0.01);

    // 货值
    const goodsValue = priceCNY * qty;

    // 运费：首重 + 续重（总重超过 1kg 部分）
    const totalWeight = weight * qty;
    const shipping = channel.base + Math.max(0, totalWeight - 1) * channel.perKg;

    // 保险（按货值）
    const insurance = $("#insurance").checked ? goodsValue * INSURANCE_RATE : 0;

    // CIF = 货值 + 运费 + 保险
    const cif = goodsValue + shipping + insurance;

    // 关税：检查免征门槛（de minimis 以 USD 计）
    const cifUSD = cif / FX.USD;
    const dutyRate = country.duty[cat] ?? country.duty.default;
    const dutyFree = country.deMinimis > 0 && cifUSD <= country.deMinimis;
    const duty = dutyFree ? 0 : cif * dutyRate;

    // 增值税/GST：基于 CIF + 关税
    const vat = (cif + duty) * country.vat;

    const grand = cif + duty + vat;
    const unit = grand / qty;
    const taxRatio = goodsValue > 0 ? ((duty + vat) / goodsValue * 100) : 0;

    render({ goodsValue, shipping, insurance, cif, duty, vat, grand, unit,
             dutyFree, dutyRate, country, taxRatio });
  }

  function render(r) {
    const rows = [
      ["商品货值", fmt(r.goodsValue), ""],
      ["国际运费", fmt(r.shipping), ""],
      ["运输保险", r.insurance ? fmt(r.insurance) : "未购买", ""],
      ["CIF 到岸价", fmt(r.cif), ""],
      [`关税（${(r.dutyRate * 100).toFixed(1)}%）`,
        r.dutyFree ? "免征（低于免税门槛）" : fmt(r.duty),
        r.dutyFree ? "free" : "tax"],
      [`${r.country.vatName || "VAT"}（基于 CIF+关税）`, r.country.vat ? fmt(r.vat) : "无", r.country.vat ? "tax" : "free"],
    ];
    $("#breakdown").innerHTML = rows.map(([k, v, cls]) =>
      `<div class="bk-row"><span>${k}</span><span class="${cls}">${v}</span></div>`).join("");

    $("#grandTotal").textContent = fmt(r.grand);
    $("#unitCost").textContent = fmt(r.unit) + " / 件";
    $("#taxRatio").textContent = r.taxRatio.toFixed(1) + "%";

    const note = $("#deMinimisNote");
    if (r.dutyFree) {
      note.textContent = `✅ 货值低于 ${r.country.name} 的免税门槛（$${r.country.deMinimis}），本单免征关税。`;
      note.classList.add("show");
    } else {
      note.classList.remove("show");
    }

    drawChart(r);
  }

  // 成本构成条形图（原生 canvas，零依赖）
  function drawChart(r) {
    const canvas = $("#chart");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const parts = [
      ["货值", r.goodsValue, "#0ea5e9"],
      ["运费", r.shipping + r.insurance, "#94a3b8"],
      ["关税", r.duty, "#f59e0b"],
      ["VAT/GST", r.vat, "#ef4444"],
    ];
    const max = Math.max(...parts.map(p => p[1]), 1);
    const barH = 24, gap = 14, labelW = 64;
    const scale = (W - labelW - 70) / max;

    ctx.font = "12px sans-serif";
    parts.forEach(([name, val, color], i) => {
      const y = i * (barH + gap) + 8;
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "left";
      ctx.fillText(name, 4, y + barH / 2 + 4);
      ctx.fillStyle = color;
      const w = Math.max(2, val * scale);
      ctx.beginPath();
      ctx.roundRect(labelW, y, w, barH, 5);
      ctx.fill();
      ctx.fillStyle = "#17202b";
      ctx.fillText(fmt(val), labelW + w + 8, y + barH / 2 + 4);
    });
  }

  // 事件
  document.querySelectorAll("input, select").forEach(el =>
    el.addEventListener("input", calculate));

  calculate();
})();
