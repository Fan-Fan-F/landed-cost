// 演示用参考数据（原创整理，非官方税率，实际以海关公告为准）

// 汇率：1 单位外币 = X CNY
const FX = { USD: 7.15, CNY: 1, EUR: 7.8 };

// 目的国规则
// duty: 按品类的关税税率（基于 CIF）；vat: 进口增值税/GST（基于 CIF+关税）
// deMinimis: 免征关税的货值门槛（USD），0 表示无免征
const COUNTRIES = {
  US: { name: "美国", deMinimis: 800, vat: 0, vatName: "无联邦 VAT",
        duty: { apparel: 0.165, electronics: 0, beauty: 0.048, home: 0.035, toys: 0, default: 0.03 } },
  EU: { name: "欧盟（德国）", deMinimis: 0, vat: 0.19, vatName: "VAT 19%",
        duty: { apparel: 0.12, electronics: 0, beauty: 0.065, home: 0.037, toys: 0.047, default: 0.04 } },
  UK: { name: "英国", deMinimis: 0, vat: 0.20, vatName: "VAT 20%",
        duty: { apparel: 0.12, electronics: 0, beauty: 0.06, home: 0.035, toys: 0.045, default: 0.04 } },
  JP: { name: "日本", deMinimis: 65, vat: 0.10, vatName: "消费税 10%",
        duty: { apparel: 0.10, electronics: 0, beauty: 0.05, home: 0.03, toys: 0, default: 0.035 } },
  AU: { name: "澳大利亚", deMinimis: 650, vat: 0.10, vatName: "GST 10%",
        duty: { apparel: 0.05, electronics: 0, beauty: 0.05, home: 0.05, toys: 0, default: 0.05 } },
  CA: { name: "加拿大", deMinimis: 15, vat: 0.05, vatName: "GST 5%",
        duty: { apparel: 0.18, electronics: 0, beauty: 0.065, home: 0.06, toys: 0, default: 0.05 } },
  SG: { name: "新加坡", deMinimis: 0, vat: 0.09, vatName: "GST 9%",
        duty: { apparel: 0, electronics: 0, beauty: 0, home: 0, toys: 0, default: 0 } },
  BR: { name: "巴西", deMinimis: 0, vat: 0.17, vatName: "ICMS ≈17%",
        duty: { apparel: 0.35, electronics: 0.16, beauty: 0.18, home: 0.14, toys: 0.2, default: 0.16 } },
};

const CATEGORIES = {
  apparel: "服装鞋帽",
  electronics: "数码电子",
  beauty: "美妆个护",
  home: "家居用品",
  toys: "玩具模型",
  default: "其他品类",
};

// 物流渠道：首重 + 续重（每 kg，CNY），时效说明
const CHANNELS = {
  ems:     { name: "EMS 国际小包", base: 90,  perKg: 55,  eta: "7-15 天" },
  dhl:     { name: "DHL 快递",     base: 160, perKg: 85,  eta: "3-5 天" },
  fedex:   { name: "FedEx 优先",   base: 175, perKg: 90,  eta: "2-4 天" },
  sea:     { name: "海运拼箱",     base: 40,  perKg: 12,  eta: "25-40 天" },
  special: { name: "专线小包",     base: 55,  perKg: 38,  eta: "8-12 天" },
};

const INSURANCE_RATE = 0.015; // 保险费率（按货值）
