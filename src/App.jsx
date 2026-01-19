// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";

/* ======================
   工具函数
====================== */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const fmtUSD = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const i18n = {
  zh: {
    lang_zh: "中文",
    lang_en: "English",
    step_of: ({ step, total }) => `第 ${step} / ${total} 步`,
    nav_prev: "上一步",
    nav_next: "下一步",
    step1_title: "你的长期照护，最怕失去什么？",
    step1_subtitle: "长期照护真正可怕的，往往不是花多少钱，而是你在关键时刻还能不能选择。请选择最不希望发生的 1–3 项。",
    choice_active: "已选择（可再次点击取消）",
    choice_inactive: "点击选择",
    selected_count: ({ count }) => `已选：${count} / 3`,
    screen2_title: "建立你的压力测试基准",
    screen2_subtitle: "先不引入外部概率数据，把框架跑通。性别/配偶参数为后续模型做准备。",
    birth_year_label: "你的出生年份（YYYY）",
    birth_year_hint: "现在可连续输入 4 位；离开输入框会自动校验。",
    birth_year_placeholder: "例如：1957",
    current_age: ({ age }) => `当前年龄：${age} 岁`,
    current_age_missing: "（请先输入有效出生年份）",
    gender_self_label: "你的性别（为后续概率模型预留）",
    gender_self_hint: "当前版本不进入计算，但会显示选择结果。",
    gender_male: "男",
    gender_female: "女",
    include_spouse_label: "是否考虑配偶",
    include_spouse_hint: "开启后可输入配偶出生年与性别。",
    include_spouse_no: "不考虑配偶",
    include_spouse_yes: "考虑配偶",
    spouse_birth_label: "配偶出生年份（YYYY）",
    spouse_birth_placeholder: "例如：1959",
    spouse_age: ({ age }) => `配偶年龄：${age} 岁`,
    spouse_age_optional: "（可选）",
    spouse_gender_label: "配偶性别",
    ltc_mode_label: "情景：LTC 发生方式",
    ltc_mode_hint: "现在可见地显示选择结果。",
    ltc_mode_one: "仅一人 1 段 LTC",
    ltc_mode_two: "先后两人 2 段 LTC 相加",
    start_age_label: "情景起点年龄",
    start_age_hint: "例如 85；应 ≥ 当前年龄。",
    duration_years_label: "单段护理持续年限",
    duration_years_hint: "默认 5 年。",
    spouse_gap_label: "高级：两人发生间隔（年）",
    spouse_gap_hint: "仅在“考虑配偶 + 两段”时有效。",
    spouse_gap_status: ({ active }) => `当前状态：${active ? "生效" : "（当前不生效）"}`,
    cost_growth_label: "高级：成本年化增长率（%）",
    cost_growth_hint: "用于把“今天成本”推到“情景起点年龄”的成本。",
    annual_cost_label: "LTC 年度成本（按今天价格）",
    annual_cost_hint: "系统将按增长率推算到情景起点年龄。",
    annual_cost_prefix: ({ startAge }) => `推算到情景起点年龄（${startAge} 岁）的年度成本 ≈`,
    annual_cost_suffix_with_age: ({ currentAge, yearsToStart }) => `（从当前年龄 ${currentAge} 岁推 ${yearsToStart} 年）`,
    annual_cost_suffix_no_birth: "（未输入出生年时默认不外推）",
    screen3_title: "哪些钱，真的能在压力时刻用上？",
    screen3_subtitle: "我们只计算你愿意、也能快速动用的部分：现金/可变现资产 + 未来计划补充。",
    current_pool_label: "当前可用缓冲池（两人合计）",
    current_pool_hint: "例如：现金 + 可快速变现的投资账户。",
    current_pool_value: "当前缓冲池：",
    annual_contribution_label: "每年可追加投入（两人合计）",
    annual_contribution_hint: "每年愿意从现金流/再平衡中追加到缓冲池的金额。",
    contribution_years_label: "追加投入年数",
    contribution_years_hint: "例如：投入 10 年（不超过到起点的年数）。",
    net_return_label: "缓冲池净回报（%）",
    net_return_hint: "税后/费用后净回报（工程假设）。",
    net_return_current: ({ value }) => `当前选择：${value}%`,
    tip_title: "提示",
    tip_body: "成本通胀/增长已在 Screen 2 的成本路径里；这里的回报只用于缓冲池资产增长，不会重复把通胀叠加到成本。",
    screen4_title: "合同/福利：你希望“确定性覆盖”多少？",
    screen4_subtitle: "工程参数：若发生 LTC，每年可由合同/福利支付多少、持续多少年。",
    has_contract_label: "是否已有 LTC 合同 / 福利来源？",
    has_contract_hint: "例如：LTC保单、雇主福利、年金/Life+LTC rider 等。",
    has_contract_no: "暂无",
    has_contract_yes: "有",
    contract_amount_label: "合同/福利：每年可支付金额（起点年口径）",
    contract_amount_hint: "默认不再自动通胀，避免重复。",
    contract_years_label: "合同/福利可支付年数",
    contract_years_hint: "例如：6 年。",
    no_contract_note: "你选择“暂无合同/福利”。后续计算默认合同覆盖 = 0。",
    screen5_title: "缓冲系数（不含通胀）",
    screen5_subtitle: "通胀/护理成本增长已在 Screen 2 进入成本路径。这里缓冲只覆盖：升级、额外服务、摩擦等非通胀不确定性。",
    buffer_pct_label: "缓冲比例（%）",
    buffer_pct_hint: "建议 0%–30%。不是通胀，是非通胀不确定性的保护垫。",
    buffer_relation_title: "关系",
    buffer_relation_body: ({ multiplier }) => `缓冲倍数 = 1 + 缓冲比例 / 100 = ${multiplier}x`,
    annual_cost_at_start_label: "情景起点年龄年度成本（已含通胀推算）",
    buffer_first_year_label: "加入缓冲后（首年）≈",
    plan_c_title: "Plan C（占位）",
    plan_c_subtitle: "如后续需要，可用它模拟“成本降低”。",
    plan_c_off: "关闭",
    plan_c_on: "开启",
    plan_c_cut_label: "成本降低比例（%）",
    plan_c_cut_hint: "例如居家照护优化、技术辅助等。",
    screen6_title: "结果摘要（含年度棒图）",
    screen6_subtitle: "从情景开始后逐年展示：合同/福利、自付（缓冲池支付）、支付后剩余资产。",
    scenario_label: "情景：",
    scenario_self_only: "仅本人（不含配偶）",
    scenario_one_segment: "仅一人（单段）",
    scenario_two_segments: "夫妻先后两人（两段）",
    cost_growth_inline: "成本增长率：",
    buffer_inline: "缓冲比例：",
    buffer_inline_suffix: ({ multiplier }) => `（${multiplier}x，非通胀）`,
    start_age_cost_label: "起点年龄年度成本：",
    spouse_gap_inline: ({ gap }) => `；两人间隔 ${gap} 年`,
    bar_title: "年度棒图（合同/自付/剩余资产）",
    bar_legend: "蓝=合同，红=自付，绿=支付后剩余资产（按最大值归一）",
    bar_empty: "（当前情景年数为 0，无法绘制）",
    bar_contract: "合同",
    bar_oop: "自付",
    bar_remain: "支付后剩余",
    table_title: "年度明细（核对用）",
    table_year: "年",
    table_start_assets: "期初资产",
    table_ltc_cost: "LTC成本",
    table_contract: "合同",
    table_oop: "自付",
    table_end_assets: "期末资产",
    table_year_row: ({ year }) => `第 ${year} 年`,
    reset_button: "回到第 1 步重新测试",
    value_anchor_choices: {
      market_low: "在市场低点被迫卖资产",
      forced_sale: "被迫卖掉房子或核心资产",
      forced_facility: "被迫进入不想去的护理机构",
      lose_autonomy: "完全依赖子女或他人决策",
      locked_product: "被单一合同或产品锁死选择",
      cashflow_break: "现金流突然断裂，来不及调整",
    },
  },
  en: {
    lang_zh: "中文",
    lang_en: "English",
    step_of: ({ step, total }) => `Step ${step} of ${total}`,
    nav_prev: "Back",
    nav_next: "Next",
    step1_title: "What do you most want to avoid in long-term care?",
    step1_subtitle: "The real fear is not just the cost, but losing choice when it matters most. Select 1–3 items.",
    choice_active: "Selected (tap again to remove)",
    choice_inactive: "Tap to select",
    selected_count: ({ count }) => `Selected: ${count} / 3`,
    screen2_title: "Set your stress-test baseline",
    screen2_subtitle: "We start with a clean model before adding external probabilities. Gender/spouse inputs are saved for later.",
    birth_year_label: "Your birth year (YYYY)",
    birth_year_hint: "Enter 4 digits; validation happens when you leave the field.",
    birth_year_placeholder: "e.g., 1957",
    current_age: ({ age }) => `Current age: ${age}`,
    current_age_missing: "(enter a valid birth year)",
    gender_self_label: "Your gender (for future probability model)",
    gender_self_hint: "Not used in calculations yet, but displayed for confirmation.",
    gender_male: "Male",
    gender_female: "Female",
    include_spouse_label: "Include spouse?",
    include_spouse_hint: "Turn on to enter spouse birth year and gender.",
    include_spouse_no: "No spouse",
    include_spouse_yes: "Include spouse",
    spouse_birth_label: "Spouse birth year (YYYY)",
    spouse_birth_placeholder: "e.g., 1959",
    spouse_age: ({ age }) => `Spouse age: ${age}`,
    spouse_age_optional: "(optional)",
    spouse_gender_label: "Spouse gender",
    ltc_mode_label: "Scenario: how LTC occurs",
    ltc_mode_hint: "Your selection is shown clearly below.",
    ltc_mode_one: "One person, one LTC period",
    ltc_mode_two: "Two people, two periods combined",
    start_age_label: "Scenario start age",
    start_age_hint: "Example 85; should be ≥ current age.",
    duration_years_label: "Care duration (years)",
    duration_years_hint: "Default is 5 years.",
    spouse_gap_label: "Advanced: gap between two people (years)",
    spouse_gap_hint: "Only active when spouse + two periods are selected.",
    spouse_gap_status: ({ active }) => `Status: ${active ? "Active" : "Not active"}`,
    cost_growth_label: "Advanced: annual cost growth (%)",
    cost_growth_hint: "Projects today’s cost to the scenario start age.",
    annual_cost_label: "Annual LTC cost (today’s price)",
    annual_cost_hint: "Projected to the scenario start age using growth rate.",
    annual_cost_prefix: ({ startAge }) => `Estimated annual cost at start age (${startAge}) ≈`,
    annual_cost_suffix_with_age: ({ currentAge, yearsToStart }) => `(projected ${yearsToStart} years from current age ${currentAge})`,
    annual_cost_suffix_no_birth: "(enter birth year to enable projection)",
    screen3_title: "What money is truly available in a crisis?",
    screen3_subtitle: "We count only the assets you can and will mobilize: cash/liquid assets plus future contributions.",
    current_pool_label: "Current buffer pool (both people)",
    current_pool_hint: "Example: cash + liquid investment accounts.",
    current_pool_value: "Current buffer pool:",
    annual_contribution_label: "Annual contribution (both people)",
    annual_contribution_hint: "Amount you can add each year from cash flow or rebalancing.",
    contribution_years_label: "Contribution years",
    contribution_years_hint: "Example: 10 years (not exceeding years to start).",
    net_return_label: "Net return on buffer (%)",
    net_return_hint: "After-tax/fee net return (engineering assumption).",
    net_return_current: ({ value }) => `Selected: ${value}%`,
    tip_title: "Note",
    tip_body: "Cost inflation is already in the cost path (Screen 2). Return here only grows the buffer pool; it does not add cost inflation again.",
    screen4_title: "Contract/benefits: how much certainty do you want?",
    screen4_subtitle: "Engineering input: if LTC occurs, how much is paid per year and for how many years.",
    has_contract_label: "Do you have an LTC contract / benefits?",
    has_contract_hint: "Examples: LTC policy, employer benefits, annuity/Life+LTC rider.",
    has_contract_no: "No",
    has_contract_yes: "Yes",
    contract_amount_label: "Contract/benefit annual payout (start-year basis)",
    contract_amount_hint: "No automatic inflation here to avoid double counting.",
    contract_years_label: "Contract/benefit payout years",
    contract_years_hint: "Example: 6 years.",
    no_contract_note: "You selected “No contract/benefits.” Contract coverage defaults to 0.",
    screen5_title: "Buffer factor (excludes inflation)",
    screen5_subtitle: "Inflation/cost growth is already in Screen 2. The buffer covers upgrades, extras, and non-inflation uncertainty.",
    buffer_pct_label: "Buffer percentage (%)",
    buffer_pct_hint: "Suggested 0%–30%. Not inflation; it is a cushion for uncertainty.",
    buffer_relation_title: "Relation",
    buffer_relation_body: ({ multiplier }) => `Buffer factor = 1 + buffer % / 100 = ${multiplier}x`,
    annual_cost_at_start_label: "Annual cost at start age (inflation-adjusted)",
    buffer_first_year_label: "After buffer (year 1) ≈",
    plan_c_title: "Plan C (placeholder)",
    plan_c_subtitle: "If needed, use this to simulate cost reduction.",
    plan_c_off: "Off",
    plan_c_on: "On",
    plan_c_cut_label: "Cost reduction (%)",
    plan_c_cut_hint: "Example: home care optimization, tech assistance.",
    screen6_title: "Summary (with annual bars)",
    screen6_subtitle: "Year-by-year view: contract/benefits, out-of-pocket, and remaining assets.",
    scenario_label: "Scenario: ",
    scenario_self_only: "Self only (no spouse)",
    scenario_one_segment: "One person (single period)",
    scenario_two_segments: "Two people (two periods)",
    cost_growth_inline: "Cost growth: ",
    buffer_inline: "Buffer: ",
    buffer_inline_suffix: ({ multiplier }) => `(${multiplier}x, non-inflation)`,
    start_age_cost_label: "Annual cost at start age:",
    spouse_gap_inline: ({ gap }) => `; gap ${gap} years`,
    bar_title: "Annual bars (contract / out-of-pocket / remaining)",
    bar_legend: "Blue=contract, red=out-of-pocket, green=remaining assets (normalized to max)",
    bar_empty: "(No years in this scenario, nothing to plot.)",
    bar_contract: "Contract",
    bar_oop: "Out-of-pocket",
    bar_remain: "Remaining",
    table_title: "Annual detail (for reference)",
    table_year: "Year",
    table_start_assets: "Starting assets",
    table_ltc_cost: "LTC cost",
    table_contract: "Contract",
    table_oop: "Out-of-pocket",
    table_end_assets: "Ending assets",
    table_year_row: ({ year }) => `Year ${year}`,
    reset_button: "Restart from step 1",
    value_anchor_choices: {
      market_low: "Forced to sell assets at a market low",
      forced_sale: "Forced to sell a home or core assets",
      forced_facility: "Forced into an undesired care facility",
      lose_autonomy: "Rely completely on children or others to decide",
      locked_product: "Locked into a single contract or product",
      cashflow_break: "Cash flow collapses before adjustments are possible",
    },
  },
};

/* ======================
   通用 UI 组件（注意：都在 App 外部，避免输入框丢焦点）
====================== */

// ✅ 标题统一“减半感”：text-lg（比 text-xl 明显更小）
const StepShell = ({ title, subtitle, step, total = 6, stepLabel, children }) => (
  <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
    {Number.isFinite(step) && (
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[12px] font-semibold text-slate-700 shadow-sm">
          {stepLabel ?? `Step ${step} of ${total}`}
          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-slate-900"
              style={{ width: `${Math.round((step / total) * 100)}%` }}
            />
          </span>
        </div>
      </div>
    )}
    <div
      className="tracking-tight text-[22px] sm:text-[24px] mb-2"
      style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
    >
      {title}
    </div>

    {subtitle && (
      <div className="text-[13px] sm:text-sm text-slate-600 mb-5 leading-relaxed">
        {subtitle}
      </div>
    )}

    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <div className="text-sm font-medium mb-1">{label}</div>
    {children}
    {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
  </div>
);

// ✅ NumberInput：连续输入不卡（输入时不 clamp；onBlur 才 clamp）
const NumberInput = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  placeholder = "",
  className = "",
  maxDigits,
}) => {
  const [text, setText] = useState(value === undefined || value === null ? "" : String(value));

  // 外部 value 改变时同步（例如点击按钮导致的状态变更）
  useEffect(() => {
    if (value === undefined || value === null || String(value) === "") setText("");
    else setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      className={`w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
      value={text}
      onChange={(e) => {
        let next = e.target.value.replace(/\D/g, "");
        if (maxDigits) next = next.slice(0, maxDigits);
        setText(next);
      }}
      onBlur={() => {
        const raw = String(text).trim();
        if (raw === "") {
          onChange?.(undefined);
          return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          onChange?.(undefined);
          return;
        }
        const clamped = clamp(n, min, max);
        onChange?.(clamped);
        setText(String(clamped));
      }}
    />
  );
};

// ✅ 可见选择结果（高亮 + ✅），解决你说的“看不到选择的结果”
const ChoicePills = ({ value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-3 py-2 text-sm transition flex items-center gap-2 shadow-sm ${
            active ? "border-slate-900 bg-white" : "border-slate-200 bg-white/70 hover:bg-white"
          }`}
        >
          <span>{opt.label}</span>
          {active && <span>✅</span>}
        </button>
      );
    })}
  </div>
);

const Nav = ({ step, setStep, canNext = true, prevLabel = "Back", nextLabel = "Next" }) => (
  <div className="flex flex-col sm:flex-row gap-3 justify-between mt-8">
    <button
      className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white/80 shadow-sm"
      disabled={step === 1}
      onClick={() => setStep(step - 1)}
    >
      {prevLabel}
    </button>
    <button
      className={`w-full sm:w-auto px-4 py-2 rounded-xl shadow-sm ${
        canNext ? "bg-slate-900 text-white" : "bg-slate-300 text-slate-500"
      }`}
      disabled={!canNext}
      onClick={() => setStep(step + 1)}
    >
      {nextLabel}
    </button>
  </div>
);

// ✅ Screen6 棒图行（固定放在 App 外，避免组件被重建）
const BarRow = ({ label, contract, oop, remain, maxValue, labelContract, labelOop, labelRemain }) => {
  const pct = (x) => {
    if (!Number.isFinite(x) || x <= 0) return 0;
    const base = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
    return (100 * (x / base));
  };

  let w1 = pct(contract);
  let w2 = pct(oop);
  let w3 = pct(remain);
  const sum = w1 + w2 + w3;
  if (sum > 100) {
    const scale = 100 / sum;
    w1 *= scale;
    w2 *= scale;
    w3 *= scale;
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <div>{label}</div>
        <div className="tabular-nums">
          {labelContract} {fmtUSD(contract)} · {labelOop} {fmtUSD(oop)} · {labelRemain} {fmtUSD(remain)}
        </div>
      </div>
      <div
        className="w-full"
        style={{
          height: "22px",
          width: "100%",
          borderRadius: "999px",
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 100 22" preserveAspectRatio="none" width="100%" height="100%">
          <rect x="0" y="0" width={w1} height="22" fill="#60a5fa" />
          <rect x={w1} y="0" width={w2} height="22" fill="#f87171" />
          <rect x={w1 + w2} y="0" width={w3} height="22" fill="#4ade80" />
        </svg>
      </div>
    </div>
  );
};

/* ======================
   App
====================== */

export default function App() {
  const nowYear = new Date().getFullYear();
  const [step, setStep] = useState(1);
  const detectLang = () => {
    if (typeof navigator === "undefined") return "zh";
    const raw = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return raw.startsWith("zh") ? "zh" : "en";
  };
  const [lang, setLang] = useState(detectLang);

  const t = (key, params) => {
    const entry = i18n[lang]?.[key] ?? i18n.zh[key] ?? key;
    return typeof entry === "function" ? entry(params || {}) : entry;
  };

  /* -----------------------
     Screen 1：价值锚点
  ----------------------- */
  const choices = Object.entries(t("value_anchor_choices")).map(([id, label]) => ({ id, label }));
  const [valueAnchor, setValueAnchor] = useState([]);

  /* -----------------------
     Screen 2：情景输入
  ----------------------- */
  const [birthYear, setBirthYear] = useState(undefined);

  const [genderSelf, setGenderSelf] = useState("M"); // M/F

  const [includeSpouse, setIncludeSpouse] = useState(false);
  const [spouseBirthYear, setSpouseBirthYear] = useState(undefined);
  const [genderSpouse, setGenderSpouse] = useState("F");

  const [ltcMode, setLtcMode] = useState("ONE"); // ONE / TWO
  const [startAge, setStartAge] = useState(85);
  const [durationYears, setDurationYears] = useState(5);

  // ✅ 高级选项：两人发生间隔 + 成本年化增长率
  const [spouseGapYears, setSpouseGapYears] = useState(3);
  const [costGrowthPct, setCostGrowthPct] = useState(3);

  // “今天价格”的年度 LTC 成本
  const [annualCostToday, setAnnualCostToday] = useState(300000);

  const currentAge = useMemo(() => {
    const y = Number(birthYear);
    if (!y || y < 1900 || y > nowYear) return null;
    return nowYear - y;
  }, [birthYear, nowYear]);

  const spouseAge = useMemo(() => {
    const y = Number(spouseBirthYear);
    if (!y || y < 1900 || y > nowYear) return null;
    return nowYear - y;
  }, [spouseBirthYear, nowYear]);

  const costGrowth = useMemo(() => clamp(Number(costGrowthPct) / 100, 0, 0.15), [costGrowthPct]);

  const yearsToStart = useMemo(() => {
    if (!currentAge) return 0;
    return Math.max(0, Number(startAge) - Number(currentAge));
  }, [currentAge, startAge]);

  // ✅ Screen2 第三点：用 todayCost + 通胀（增长率）推算到“情景起点年龄”的年度成本
  const annualCostAtStart = useMemo(() => {
    const base = Number(annualCostToday) || 0;
    return Math.round(base * Math.pow(1 + costGrowth, yearsToStart));
  }, [annualCostToday, costGrowth, yearsToStart]);

  /* -----------------------
     Screen 3：缓冲池与投入
  ----------------------- */
  const [currentPool, setCurrentPool] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [contributionYears, setContributionYears] = useState(10);
  const [netReturnChoice, setNetReturnChoice] = useState("3.0");

  const netReturn = useMemo(() => clamp(Number(netReturnChoice) / 100, 0, 0.12), [netReturnChoice]);

  const contribYearsEff = useMemo(() => Math.max(0, Math.min(Number(contributionYears) || 0, yearsToStart)), [
    contributionYears,
    yearsToStart,
  ]);

  /* -----------------------
     Screen 4：合同/福利
  ----------------------- */
  const [hasContract, setHasContract] = useState(false);
  const [annualContractBenefit, setAnnualContractBenefit] = useState(138000);
  const [contractBenefitYears, setContractBenefitYears] = useState(6);

  /* -----------------------
     Screen 5：缓冲系数（不含通胀）
  ----------------------- */
  // ✅ 你指出“通胀已在前面算过，这里要去掉通胀”，所以这里只是“非通胀不确定性”
  const [bufferPct, setBufferPct] = useState(15);
  const bufferMultiplier = useMemo(() => 1 + (Number(bufferPct) || 0) / 100, [bufferPct]);

  // Plan B/C（保留，但此版重点按你要求修 1/2/6 的问题；棒图会体现效果）
  const [planBOn, setPlanBOn] = useState(false);
  const [planBExtraPool, setPlanBExtraPool] = useState(250000);

  const [planCOn, setPlanCOn] = useState(false);
  const [planCCostCutPct, setPlanCCostCutPct] = useState(10);
  const effectiveCostCut = useMemo(() => {
    if (!planCOn) return 1;
    return 1 - clamp((Number(planCCostCutPct) || 0) / 100, 0, 0.5);
  }, [planCOn, planCCostCutPct]);

  /* -----------------------
     推到情景开始时的资金池（含 PlanB）
  ----------------------- */
  const poolAtStart = useMemo(() => {
    let pool = Number(currentPool) || 0;
    const r = netReturn;

    for (let y = 1; y <= yearsToStart; y++) {
      pool = pool * (1 + r);
      if (y <= contribYearsEff) pool += Number(annualContribution) || 0;
    }
    if (planBOn) pool += Number(planBExtraPool) || 0;
    return Math.round(pool);
  }, [currentPool, annualContribution, yearsToStart, contribYearsEff, netReturn, planBOn, planBExtraPool]);

  /* -----------------------
     情景总年数
  ----------------------- */
  const ltcHorizonYears = useMemo(() => {
    if (ltcMode === "ONE") return Number(durationYears) || 0;
    return (Number(spouseGapYears) || 0) + (Number(durationYears) || 0);
  }, [ltcMode, spouseGapYears, durationYears]);

  /* -----------------------
     成本路径（情景开始后逐年）
     - costGrowth 负责“通胀/增长”
     - bufferMultiplier 负责“非通胀不确定性”
     - planC 负责“成本降低”
  ----------------------- */
  const ltcCostSeries = useMemo(() => {
    const g = costGrowth;
    const base = Number(annualCostAtStart) || 0;
    const dur = Number(durationYears) || 0;
    const gap = Number(spouseGapYears) || 0;
    const years = Math.max(0, ltcHorizonYears);

    const arr = [];
    for (let t = 0; t < years; t++) {
      let cost = 0;

      // 第一段：t=0..dur-1
      if (t < dur) cost += base * Math.pow(1 + g, t);

      // 第二段：仅 includeSpouse && TWO
      if (includeSpouse && ltcMode === "TWO") {
        const t2 = t - gap;
        if (t2 >= 0 && t2 < dur) {
          cost += base * Math.pow(1 + g, t); // 同一时间轴下第二人同年成本
        }
      }

      cost = cost * effectiveCostCut;
      cost = cost * bufferMultiplier;

      arr.push(Math.round(cost));
    }
    return arr;
  }, [
    annualCostAtStart,
    costGrowth,
    durationYears,
    spouseGapYears,
    ltcHorizonYears,
    includeSpouse,
    ltcMode,
    effectiveCostCut,
    bufferMultiplier,
  ]);

  /* -----------------------
     合同给付序列（默认不再通胀，避免重复）
  ----------------------- */
  const contractSeries = useMemo(() => {
    const years = Math.max(0, ltcHorizonYears);
    const arr = [];
    for (let t = 0; t < years; t++) {
      if (!hasContract) arr.push(0);
      else arr.push(t < (Number(contractBenefitYears) || 0) ? (Number(annualContractBenefit) || 0) : 0);
    }
    return arr;
  }, [ltcHorizonYears, hasContract, annualContractBenefit, contractBenefitYears]);

  /* -----------------------
     timeline：逐年资产 / 支出
  ----------------------- */
  const timeline = useMemo(() => {
    const years = Math.max(0, ltcHorizonYears);
    let assets = Number(poolAtStart) || 0;

    const rows = [];
    for (let t = 0; t < years; t++) {
      const cost = ltcCostSeries[t] || 0;
      const contract = contractSeries[t] || 0;
      const oop = Math.max(0, cost - contract);

      const startAssets = assets;

      assets = Math.max(0, assets - oop);
      assets = assets * (1 + netReturn);

      rows.push({
        yearIndex: t + 1,
        startAssets: Math.round(startAssets),
        ltcCost: Math.round(cost),
        contract: Math.round(contract),
        oop: Math.round(oop),
        endAssets: Math.round(assets),
      });
    }
    return rows;
  }, [ltcHorizonYears, poolAtStart, ltcCostSeries, contractSeries, netReturn]);

  const chartMax = useMemo(() => {
    let m = 1;
    for (const r of timeline) m = Math.max(m, r.startAssets, r.ltcCost);
    return m;
  }, [timeline]);

  /* ======================
     各 Screen 渲染函数（不是组件！避免被当成新组件类型）
====================== */

  const renderScreen1 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 1, total: 6 })}
      step={1}
      title={t("step1_title")}
      subtitle={t("step1_subtitle")}
    >
      <div className="grid md:grid-cols-2 gap-3">
        {choices.map((c) => {
          const active = valueAnchor.includes(c.id);
          return (
            <button
              key={c.id}
              className={`text-left rounded-2xl border p-4 transition ${
                active ? "border-black bg-gray-50" : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setValueAnchor((prev) => {
                  if (prev.includes(c.id)) return prev.filter((x) => x !== c.id);
                  if (prev.length >= 3) return prev;
                  return [...prev, c.id];
                });
              }}
              type="button"
            >
              <div className="text-sm font-medium flex items-center justify-between">
                <span>{c.label}</span>
                {/* ✅ 只保留一个勾 */}
                {active && <span className="text-lg">✅</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {active ? t("choice_active") : t("choice_inactive")}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-600">{t("selected_count", { count: valueAnchor.length })}</div>

      <Nav
        step={step}
        setStep={setStep}
        canNext={valueAnchor.length >= 1}
        prevLabel={t("nav_prev")}
        nextLabel={t("nav_next")}
      />
    </StepShell>
  );

  const renderScreen2 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 2, total: 6 })}
      step={2}
      title={t("screen2_title")}
      subtitle={t("screen2_subtitle")}
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label={t("birth_year_label")} hint={t("birth_year_hint")}>
            <NumberInput
              value={birthYear}
              onChange={(v) => setBirthYear(clamp(v, 1900, nowYear))}
              min={1900}
              max={nowYear}
              placeholder={t("birth_year_placeholder")}
              maxDigits={4}
            />
            <div className="text-xs text-gray-600 mt-2">
              {currentAge ? t("current_age", { age: currentAge }) : t("current_age_missing")}
            </div>
          </Field>

          <Field label={t("gender_self_label")} hint={t("gender_self_hint")}>
            <ChoicePills
              value={genderSelf}
              onChange={setGenderSelf}
              options={[
                { value: "M", label: t("gender_male") },
                { value: "F", label: t("gender_female") },
              ]}
            />
          </Field>

          <Field label={t("include_spouse_label")} hint={t("include_spouse_hint")}>
            <ChoicePills
              value={includeSpouse ? "YES" : "NO"}
              onChange={(v) => setIncludeSpouse(v === "YES")}
              options={[
                { value: "NO", label: t("include_spouse_no") },
                { value: "YES", label: t("include_spouse_yes") },
              ]}
            />

            {includeSpouse && (
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">{t("spouse_birth_label")}</div>
                  <NumberInput
                    value={spouseBirthYear}
                    onChange={(v) => setSpouseBirthYear(clamp(v, 1900, nowYear))}
                    min={1900}
                    max={nowYear}
                    placeholder={t("spouse_birth_placeholder")}
                    maxDigits={4}
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    {spouseAge ? t("spouse_age", { age: spouseAge }) : t("spouse_age_optional")}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t("spouse_gender_label")}</div>
                  <ChoicePills
                    value={genderSpouse}
                    onChange={setGenderSpouse}
                    options={[
                      { value: "M", label: t("gender_male") },
                      { value: "F", label: t("gender_female") },
                    ]}
                  />
                </div>
              </div>
            )}
          </Field>
        </div>

        <div className="space-y-4">
          <Field label={t("ltc_mode_label")} hint={t("ltc_mode_hint")}>
            <ChoicePills
              value={ltcMode}
              onChange={setLtcMode}
              options={[
                { value: "ONE", label: t("ltc_mode_one") },
                { value: "TWO", label: t("ltc_mode_two") },
              ]}
            />
          </Field>

          <Field label={t("start_age_label")} hint={t("start_age_hint")}>
            <NumberInput value={startAge} onChange={(v) => setStartAge(clamp(v, 40, 110))} min={40} max={110} />
          </Field>

          <Field label={t("duration_years_label")} hint={t("duration_years_hint")}>
            <NumberInput
              value={durationYears}
              onChange={(v) => setDurationYears(clamp(v, 1, 20))}
              min={1}
              max={20}
            />
          </Field>

          <Field label={t("spouse_gap_label")} hint={t("spouse_gap_hint")}>
            <NumberInput
              value={spouseGapYears}
              onChange={(v) => setSpouseGapYears(clamp(v, 0, 20))}
              min={0}
              max={20}
            />
            <div className="text-xs text-gray-600 mt-1">
              {t("spouse_gap_status", { active: includeSpouse && ltcMode === "TWO" })}
            </div>
          </Field>

          <Field label={t("cost_growth_label")} hint={t("cost_growth_hint")}>
            <NumberInput value={costGrowthPct} onChange={(v) => setCostGrowthPct(clamp(v, 0, 15))} min={0} max={15} />
          </Field>

          <Field label={t("annual_cost_label")} hint={t("annual_cost_hint")}>
            <NumberInput
              value={annualCostToday}
              onChange={(v) => setAnnualCostToday(clamp(v, 50000, 2000000))}
              min={50000}
              max={2000000}
            />
            <div className="text-xs text-gray-600 mt-2">
              {t("annual_cost_prefix", { startAge })}{" "}
              <span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
              {currentAge ? (
                <span className="text-gray-500">
                  {t("annual_cost_suffix_with_age", { currentAge, yearsToStart })}
                </span>
              ) : (
                <span className="text-gray-500">{t("annual_cost_suffix_no_birth")}</span>
              )}
            </div>
          </Field>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext prevLabel={t("nav_prev")} nextLabel={t("nav_next")} />
    </StepShell>
  );

  const renderScreen3 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 3, total: 6 })}
      step={3}
      title={t("screen3_title")}
      subtitle={t("screen3_subtitle")}
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label={t("current_pool_label")} hint={t("current_pool_hint")}>
            <NumberInput value={currentPool} onChange={(v) => setCurrentPool(clamp(v, 0, 50000000))} min={0} max={50000000} />
            <div className="text-xs text-gray-600 mt-2">
              {t("current_pool_value")} <span className="font-semibold">{fmtUSD(currentPool)}</span>
            </div>
          </Field>

          <Field label={t("annual_contribution_label")} hint={t("annual_contribution_hint")}>
            <NumberInput
              value={annualContribution}
              onChange={(v) => setAnnualContribution(clamp(v, 0, 5000000))}
              min={0}
              max={5000000}
            />
          </Field>

          <Field label={t("contribution_years_label")} hint={t("contribution_years_hint")}>
            <NumberInput value={contributionYears} onChange={(v) => setContributionYears(clamp(v, 0, 40))} min={0} max={40} />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label={t("net_return_label")} hint={t("net_return_hint")}>
            <ChoicePills
              value={netReturnChoice}
              onChange={setNetReturnChoice}
              options={[
                { value: "1.0", label: "1%" },
                { value: "2.0", label: "2%" },
                { value: "3.0", label: "3%" },
                { value: "4.0", label: "4%" },
                { value: "5.0", label: "5%" },
              ]}
            />
            <div className="text-xs text-gray-600 mt-2">
              {t("net_return_current", { value: netReturnChoice })}
            </div>
          </Field>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">{t("tip_title")}</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {t("tip_body")}
            </div>
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext prevLabel={t("nav_prev")} nextLabel={t("nav_next")} />
    </StepShell>
  );

  const renderScreen4 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 4, total: 6 })}
      step={4}
      title={t("screen4_title")}
      subtitle={t("screen4_subtitle")}
    >
      <div className="space-y-4">
        <Field label={t("has_contract_label")} hint={t("has_contract_hint")}>
          <ChoicePills
            value={hasContract ? "YES" : "NO"}
            onChange={(v) => setHasContract(v === "YES")}
            options={[
              { value: "NO", label: t("has_contract_no") },
              { value: "YES", label: t("has_contract_yes") },
            ]}
          />
        </Field>

        {hasContract ? (
          <div className="grid md:grid-cols-2 gap-5">
            <Field label={t("contract_amount_label")} hint={t("contract_amount_hint")}>
              <NumberInput
                value={annualContractBenefit}
                onChange={(v) => setAnnualContractBenefit(clamp(v, 0, 2000000))}
                min={0}
                max={2000000}
              />
            </Field>

            <Field label={t("contract_years_label")} hint={t("contract_years_hint")}>
              <NumberInput
                value={contractBenefitYears}
                onChange={(v) => setContractBenefitYears(clamp(v, 0, 30))}
                min={0}
                max={30}
              />
            </Field>
          </div>
        ) : (
          <div className="rounded-2xl border p-4 bg-gray-50 text-xs text-gray-700 leading-relaxed">
            {t("no_contract_note")}
          </div>
        )}
      </div>

      <Nav step={step} setStep={setStep} canNext prevLabel={t("nav_prev")} nextLabel={t("nav_next")} />
    </StepShell>
  );

  const renderScreen5 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 5, total: 6 })}
      step={5}
      title={t("screen5_title")}
      subtitle={t("screen5_subtitle")}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label={t("buffer_pct_label")} hint={t("buffer_pct_hint")}>
            <NumberInput value={bufferPct} onChange={(v) => setBufferPct(clamp(v ?? 0, 0, 50))} min={0} max={50} />
          </Field>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">{t("buffer_relation_title")}</div>
            <div className="text-xs text-gray-700 leading-relaxed">
              {t("buffer_relation_body", { multiplier: bufferMultiplier.toFixed(2) })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="text-xs text-gray-600">{t("annual_cost_at_start_label")}</div>
            <div className="text-lg font-semibold mt-1">{fmtUSD(annualCostAtStart)}</div>
            <div className="text-xs text-gray-600 mt-2">
              {t("buffer_first_year_label")}{" "}
              <span className="font-semibold">
                {fmtUSD(Math.round((annualCostAtStart || 0) * bufferMultiplier))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">{t("plan_c_title")}</div>
            <div className="text-xs text-gray-600 mb-3">{t("plan_c_subtitle")}</div>
            <ChoicePills
              value={planCOn ? "ON" : "OFF"}
              onChange={(v) => setPlanCOn(v === "ON")}
              options={[
                { value: "OFF", label: t("plan_c_off") },
                { value: "ON", label: t("plan_c_on") },
              ]}
            />
            {planCOn && (
              <div className="mt-3">
                <Field label={t("plan_c_cut_label")} hint={t("plan_c_cut_hint")}>
                  <NumberInput value={planCCostCutPct} onChange={(v) => setPlanCCostCutPct(clamp(v ?? 0, 0, 50))} min={0} max={50} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext prevLabel={t("nav_prev")} nextLabel={t("nav_next")} />
    </StepShell>
  );

  const renderScreen6 = () => (
    <StepShell
      stepLabel={t("step_of", { step: 6, total: 6 })}
      step={6}
      title={t("screen6_title")}
      subtitle={t("screen6_subtitle")}
    >
      <div className="rounded-2xl border p-4 bg-gray-50 mb-5">
        <div className="text-xs text-gray-600">
          {t("scenario_label")}
          {includeSpouse ? (ltcMode === "TWO" ? t("scenario_two_segments") : t("scenario_one_segment")) : t("scenario_self_only")}
          {" · "}
          {t("cost_growth_inline")}
          {costGrowthPct}%{" · "}
          {t("buffer_inline")}
          {bufferPct}% {t("buffer_inline_suffix", { multiplier: bufferMultiplier.toFixed(2) })}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {t("start_age_cost_label")} <span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
          {includeSpouse && ltcMode === "TWO" ? <>{t("spouse_gap_inline", { gap: spouseGapYears })}</> : null}
        </div>
      </div>

      {/* ✅ 棒图：你说之前没看到，这里强制放在表格之前 */}
      <div className="rounded-2xl border p-4 mb-6">
        <div className="text-sm font-semibold mb-2">{t("bar_title")}</div>
        <div className="text-xs text-gray-600 mb-4">{t("bar_legend")}</div>

        {timeline.length === 0 ? (
          <div className="text-xs text-gray-600">{t("bar_empty")}</div>
        ) : (
          <div className="space-y-3">
            {timeline.map((r) => (
              <BarRow
                key={r.yearIndex}
                label={t("table_year_row", { year: r.yearIndex })}
                contract={r.contract}
                oop={r.oop}
                remain={Math.max(0, r.startAssets - r.oop)}
                maxValue={chartMax}
                labelContract={t("bar_contract")}
                labelOop={t("bar_oop")}
                labelRemain={t("bar_remain")}
              />
            ))}
          </div>
        )}
      </div>

      {/* 表格核对 */}
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-3">{t("table_title")}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-2 pr-3">{t("table_year")}</th>
                <th className="text-right py-2 px-2">{t("table_start_assets")}</th>
                <th className="text-right py-2 px-2">{t("table_ltc_cost")}</th>
                <th className="text-right py-2 px-2">{t("table_contract")}</th>
                <th className="text-right py-2 px-2">{t("table_oop")}</th>
                <th className="text-right py-2 pl-2">{t("table_end_assets")}</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((r) => (
                <tr key={r.yearIndex} className="border-t">
                  <td className="py-2 pr-3">{t("table_year_row", { year: r.yearIndex })}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(r.startAssets)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(r.ltcCost)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(r.contract)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(r.oop)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{fmtUSD(r.endAssets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最后一页不提供“下一步” */}
      <div className="flex justify-end mt-8">
        <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => setStep(1)} type="button">
          {t("reset_button")}
        </button>
      </div>
    </StepShell>
  );

  /* ======================
     主渲染
====================== */
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-4 flex justify-end">
        <div className="inline-flex rounded-full border border-white/70 bg-white/70 p-1 text-xs shadow-sm">
          <button
            type="button"
            className={`px-3 py-1 rounded-full ${lang === "zh" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            onClick={() => setLang("zh")}
          >
            {t("lang_zh")}
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            onClick={() => setLang("en")}
          >
            {t("lang_en")}
          </button>
        </div>
      </div>
      {step === 1 && renderScreen1()}
      {step === 2 && renderScreen2()}
      {step === 3 && renderScreen3()}
      {step === 4 && renderScreen4()}
      {step === 5 && renderScreen5()}
      {step === 6 && renderScreen6()}
    </div>
  );
}
