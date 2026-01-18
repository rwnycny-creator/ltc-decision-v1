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

/* ======================
   通用 UI 组件（注意：都在 App 外部，避免输入框丢焦点）
====================== */

// ✅ 标题统一“减半感”：text-lg（比 text-xl 明显更小）
const StepShell = ({ title, subtitle, children }) => (
  <div className="max-w-4xl mx-auto px-8 py-12">
    <div
      style={{
        fontSize: "18px",      // 你想再小就改 16px
        lineHeight: "24px",
        fontWeight: 600,
        marginBottom: "8px",
      }}
    >
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: "12px", lineHeight: "18px", color: "#4B5563", marginBottom: "20px" }}>
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
      className={`w-full rounded-xl border px-3 py-2 text-base ${className}`}
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
          className={`rounded-full border px-3 py-2 text-sm transition flex items-center gap-2 ${
            active ? "border-black bg-gray-50" : "hover:bg-gray-50"
          }`}
        >
          <span>{opt.label}</span>
          {active && <span>✅</span>}
        </button>
      );
    })}
  </div>
);

const Nav = ({ step, setStep, canNext = true }) => (
  <div className="flex justify-between mt-8">
    <button
      className="px-4 py-2 rounded-lg border"
      disabled={step === 1}
      onClick={() => setStep(step - 1)}
    >
      上一步
    </button>
    <button
      className={`px-4 py-2 rounded-lg ${canNext ? "bg-black text-white" : "bg-gray-300 text-gray-500"}`}
      disabled={!canNext}
      onClick={() => setStep(step + 1)}
    >
      下一步
    </button>
  </div>
);

// ✅ Screen6 棒图行（稳健版：防 NaN/0/负数，自动钳制到 0~100%）
const BarRow = ({ label, contract = 0, oop = 0, remain = 0, maxValue = 0 }) => {
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const c = Math.max(0) * 0 + Math.max(0, safeNum(contract)); // 防止 -0 等怪值
  const o = Math.max(0, safeNum(oop));
  const r = Math.max(0, safeNum(remain));

  const max = Math.max(1, safeNum(maxValue)); // 关键：至少为 1，避免除 0

  const pct = (x) => {
    const p = (100 * x) / max;
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(100, p));
  };

  const wC = pct(c);
  const wO = pct(o);
  const wR = pct(r);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <div>{label}</div>
        <div className="tabular-nums">
          合同 {fmtUSD(c)} · 自付 {fmtUSD(o)} · 支付后剩余 {fmtUSD(r)}
        </div>
      </div>

      <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden flex">
        <div
          style={{ width: `${wC}%`, backgroundColor: "#60a5fa" }} // blue-400
          title={`合同 ${wC.toFixed(1)}%`}
        />
        <div
          style={{ width: `${wO}%`, backgroundColor: "#f87171" }} // red-400
          title={`自付 ${wO.toFixed(1)}%`}
        />
        <div
          style={{ width: `${wR}%`, backgroundColor: "#4ade80" }} // green-400
          title={`剩余 ${wR.toFixed(1)}%`}
        />
      </div>

      <div className="text-[11px] text-gray-500">
        参考上限：{fmtUSD(max)}（每段宽度已钳制到 0–100%）
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

  /* -----------------------
     Screen 1：价值锚点
  ----------------------- */
  const choices = [
    "在市场低点被迫卖资产",
    "被迫卖掉房子或核心资产",
    "被迫进入不想去的护理机构",
    "完全依赖子女或他人决策",
    "被单一合同或产品锁死选择",
    "现金流突然断裂，来不及调整",
  ];
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
    const years = Math.max(1, Number(durationYears) || 0);
    const years1 = Math.max(1, Number(durationYears) || 0);
    const years2 = planTwoStage ? Math.max(1, Number(durationYears) || 0) : 0;
    const totalYears = years1 + years2;

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
      title="你的长期照护，最怕失去什么？"
      subtitle="长期照护真正可怕的，往往不是花多少钱，而是你在关键时刻还能不能选择。请选择最不希望发生的 1–3 项。"
    >
      <div className="grid md:grid-cols-2 gap-3">
        {choices.map((c) => {
          const active = valueAnchor.includes(c);
          return (
            <button
              key={c}
              className={`text-left rounded-2xl border p-4 transition ${
                active ? "border-black bg-gray-50" : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setValueAnchor((prev) => {
                  if (prev.includes(c)) return prev.filter((x) => x !== c);
                  if (prev.length >= 3) return prev;
                  return [...prev, c];
                });
              }}
              type="button"
            >
              <div className="text-sm font-medium flex items-center justify-between">
                <span>{c}</span>
                {/* ✅ 只保留一个勾 */}
                {active && <span className="text-lg">✅</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {active ? "已选择（可再次点击取消）" : "点击选择"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-600">已选：{valueAnchor.length} / 3</div>

      <Nav step={step} setStep={setStep} canNext={valueAnchor.length >= 1} />
    </StepShell>
  );

  const renderScreen2 = () => (
    <StepShell
      title="建立你的压力测试基准"
      subtitle="先不引入外部概率数据，把框架跑通。性别/配偶参数为后续模型做准备。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="你的出生年份（YYYY）" hint="现在可连续输入 4 位；离开输入框会自动校验。">
            <NumberInput
              value={birthYear}
              onChange={(v) => setBirthYear(clamp(v, 1900, nowYear))}
              min={1900}
              max={nowYear}
              placeholder="例如：1957"
              maxDigits={4}
            />
            <div className="text-xs text-gray-600 mt-2">
              当前年龄：{currentAge ? `${currentAge} 岁` : "（请先输入有效出生年份）"}
            </div>
          </Field>

          <Field label="你的性别（为后续概率模型预留）" hint="当前版本不进入计算，但会显示选择结果。">
            <ChoicePills
              value={genderSelf}
              onChange={setGenderSelf}
              options={[
                { value: "M", label: "男" },
                { value: "F", label: "女" },
              ]}
            />
          </Field>

          <Field label="是否考虑配偶" hint="开启后可输入配偶出生年与性别。">
            <ChoicePills
              value={includeSpouse ? "YES" : "NO"}
              onChange={(v) => setIncludeSpouse(v === "YES")}
              options={[
                { value: "NO", label: "不考虑配偶" },
                { value: "YES", label: "考虑配偶" },
              ]}
            />

            {includeSpouse && (
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">配偶出生年份（YYYY）</div>
                  <NumberInput
                    value={spouseBirthYear}
                    onChange={(v) => setSpouseBirthYear(clamp(v, 1900, nowYear))}
                    min={1900}
                    max={nowYear}
                    placeholder="例如：1959"
                    maxDigits={4}
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    配偶年龄：{spouseAge ? `${spouseAge} 岁` : "（可选）"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">配偶性别</div>
                  <ChoicePills
                    value={genderSpouse}
                    onChange={setGenderSpouse}
                    options={[
                      { value: "M", label: "男" },
                      { value: "F", label: "女" },
                    ]}
                  />
                </div>
              </div>
            )}
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="情景：LTC 发生方式" hint="现在可见地显示选择结果。">
            <ChoicePills
              value={ltcMode}
              onChange={setLtcMode}
              options={[
                { value: "ONE", label: "仅一人 1 段 LTC" },
                { value: "TWO", label: "先后两人 2 段 LTC 相加" },
              ]}
            />
          </Field>

          <Field label="情景起点年龄" hint="例如 85；应 ≥ 当前年龄。">
            <NumberInput value={startAge} onChange={(v) => setStartAge(clamp(v, 40, 110))} min={40} max={110} />
          </Field>

          <Field label="单段护理持续年限" hint="默认 5 年。">
            <NumberInput
              value={durationYears}
              onChange={(v) => setDurationYears(clamp(v, 1, 20))}
              min={1}
              max={20}
            />
          </Field>

          <Field label="高级：两人发生间隔（年）" hint="仅在“考虑配偶 + 两段”时有效。">
            <NumberInput
              value={spouseGapYears}
              onChange={(v) => setSpouseGapYears(clamp(v, 0, 20))}
              min={0}
              max={20}
            />
            <div className="text-xs text-gray-600 mt-1">
              当前状态：{includeSpouse && ltcMode === "TWO" ? "生效" : "（当前不生效）"}
            </div>
          </Field>

          <Field label="高级：成本年化增长率（%）" hint="用于把“今天成本”推到“情景起点年龄”的成本。">
            <NumberInput value={costGrowthPct} onChange={(v) => setCostGrowthPct(clamp(v, 0, 15))} min={0} max={15} />
          </Field>

          <Field label="LTC 年度成本（按今天价格）" hint="系统将按增长率推算到情景起点年龄。">
            <NumberInput
              value={annualCostToday}
              onChange={(v) => setAnnualCostToday(clamp(v, 50000, 2000000))}
              min={50000}
              max={2000000}
            />
            <div className="text-xs text-gray-600 mt-2">
              推算到情景起点年龄（{startAge} 岁）的年度成本 ≈{" "}
              <span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
              {currentAge ? (
                <span className="text-gray-500">（从当前年龄 {currentAge} 岁推 {yearsToStart} 年）</span>
              ) : (
                <span className="text-gray-500">（未输入出生年时默认不外推）</span>
              )}
            </div>
          </Field>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext />
    </StepShell>
  );

  const renderScreen3 = () => (
    <StepShell
      title="哪些钱，真的能在压力时刻用上？"
      subtitle="我们只计算你愿意、也能快速动用的部分：现金/可变现资产 + 未来计划补充。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="当前可用缓冲池（两人合计）" hint="例如：现金 + 可快速变现的投资账户。">
            <NumberInput value={currentPool} onChange={(v) => setCurrentPool(clamp(v, 0, 50000000))} min={0} max={50000000} />
            <div className="text-xs text-gray-600 mt-2">
              当前缓冲池：<span className="font-semibold">{fmtUSD(currentPool)}</span>
            </div>
          </Field>

          <Field label="每年可追加投入（两人合计）" hint="每年愿意从现金流/再平衡中追加到缓冲池的金额。">
            <NumberInput
              value={annualContribution}
              onChange={(v) => setAnnualContribution(clamp(v, 0, 5000000))}
              min={0}
              max={5000000}
            />
          </Field>

          <Field label="追加投入年数" hint="例如：投入 10 年（不超过到起点的年数）。">
            <NumberInput value={contributionYears} onChange={(v) => setContributionYears(clamp(v, 0, 40))} min={0} max={40} />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="缓冲池净回报（%）" hint="税后/费用后净回报（工程假设）。">
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
              当前选择：<span className="font-semibold">{netReturnChoice}%</span>
            </div>
          </Field>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">提示</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              成本通胀/增长已在 Screen 2 的成本路径里；这里的回报只用于缓冲池资产增长，不会重复把通胀叠加到成本。
            </div>
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext />
    </StepShell>
  );

  const renderScreen4 = () => (
    <StepShell
      title="合同/福利：你希望“确定性覆盖”多少？"
      subtitle="工程参数：若发生 LTC，每年可由合同/福利支付多少、持续多少年。"
    >
      <div className="space-y-4">
        <Field label="是否已有 LTC 合同 / 福利来源？" hint="例如：LTC保单、雇主福利、年金/Life+LTC rider 等。">
          <ChoicePills
            value={hasContract ? "YES" : "NO"}
            onChange={(v) => setHasContract(v === "YES")}
            options={[
              { value: "NO", label: "暂无" },
              { value: "YES", label: "有" },
            ]}
          />
        </Field>

        {hasContract ? (
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="合同/福利：每年可支付金额（起点年口径）" hint="默认不再自动通胀，避免重复。">
              <NumberInput
                value={annualContractBenefit}
                onChange={(v) => setAnnualContractBenefit(clamp(v, 0, 2000000))}
                min={0}
                max={2000000}
              />
            </Field>

            <Field label="合同/福利可支付年数" hint="例如：6 年。">
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
            你选择“暂无合同/福利”。后续计算默认合同覆盖 = 0。
          </div>
        )}
      </div>

      <Nav step={step} setStep={setStep} canNext />
    </StepShell>
  );

  const renderScreen5 = () => (
    <StepShell
      title="缓冲系数（不含通胀）"
      subtitle="通胀/护理成本增长已在 Screen 2 进入成本路径。这里缓冲只覆盖：升级、额外服务、摩擦等非通胀不确定性。"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="缓冲比例（%）" hint="建议 0%–30%。不是通胀，是非通胀不确定性的保护垫。">
            <NumberInput value={bufferPct} onChange={(v) => setBufferPct(clamp(v ?? 0, 0, 50))} min={0} max={50} />
          </Field>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">关系</div>
            <div className="text-xs text-gray-700 leading-relaxed">
              缓冲倍数 = 1 + 缓冲比例 / 100 = <span className="font-semibold">{bufferMultiplier.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="text-xs text-gray-600">情景起点年龄年度成本（已含通胀推算）</div>
            <div className="text-lg font-semibold mt-1">{fmtUSD(annualCostAtStart)}</div>
            <div className="text-xs text-gray-600 mt-2">
              加入缓冲后（首年）≈{" "}
              <span className="font-semibold">
                {fmtUSD(Math.round((annualCostAtStart || 0) * bufferMultiplier))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">Plan C（占位）</div>
            <div className="text-xs text-gray-600 mb-3">如后续需要，可用它模拟“成本降低”。</div>
            <ChoicePills
              value={planCOn ? "ON" : "OFF"}
              onChange={(v) => setPlanCOn(v === "ON")}
              options={[
                { value: "OFF", label: "关闭" },
                { value: "ON", label: "开启" },
              ]}
            />
            {planCOn && (
              <div className="mt-3">
                <Field label="成本降低比例（%）" hint="例如居家照护优化、技术辅助等。">
                  <NumberInput value={planCCostCutPct} onChange={(v) => setPlanCCostCutPct(clamp(v ?? 0, 0, 50))} min={0} max={50} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext />
    </StepShell>
  );

  const renderScreen6 = () => (
    <StepShell
      title="结果摘要（含年度棒图）"
      subtitle="从情景开始后逐年展示：合同/福利、自付（缓冲池支付）、支付后剩余资产。"
    >
      <div className="rounded-2xl border p-4 bg-gray-50 mb-5">
        <div className="text-xs text-gray-600">
          情景：{includeSpouse ? (ltcMode === "TWO" ? "夫妻先后两人（两段）" : "仅一人（单段）") : "仅本人（不含配偶）"}
          {" · "}
          成本增长率：{costGrowthPct}%{" · "}
          缓冲比例：{bufferPct}%（{bufferMultiplier.toFixed(2)}x，非通胀）
        </div>
        <div className="text-xs text-gray-600 mt-1">
          起点年龄年度成本：<span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
          {includeSpouse && ltcMode === "TWO" ? <>；两人间隔 {spouseGapYears} 年</> : null}
        </div>
      </div>

      {/* ✅ 棒图：你说之前没看到，这里强制放在表格之前 */}
      <div className="rounded-2xl border p-4 mb-6">
        <div className="text-sm font-semibold mb-2">年度棒图（合同/自付/剩余资产）</div>
        <div className="text-xs text-gray-600 mb-4">蓝=合同，红=自付，绿=支付后剩余资产（按最大值归一）</div>

        {timeline.length === 0 ? (
          <div className="text-xs text-gray-600">（当前情景年数为 0，无法绘制）</div>
        ) : (
          <div className="space-y-3">
            {timeline.map((r) => (
              <BarRow
                key={r.yearIndex}
                label={`第 ${r.yearIndex} 年`}
                contract={r.contract}
                oop={r.oop}
                remain={Math.max(0, r.startAssets - r.oop)}
                maxValue={chartMax}
              />
            ))}
          </div>
        )}
      </div>

      {/* 表格核对 */}
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-3">年度明细（核对用）</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-2 pr-3">年</th>
                <th className="text-right py-2 px-2">期初资产</th>
                <th className="text-right py-2 px-2">LTC成本</th>
                <th className="text-right py-2 px-2">合同</th>
                <th className="text-right py-2 px-2">自付</th>
                <th className="text-right py-2 pl-2">期末资产</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((r) => (
                <tr key={r.yearIndex} className="border-t">
                  <td className="py-2 pr-3">第 {r.yearIndex} 年</td>
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
          回到第 1 步重新测试
        </button>
      </div>
    </StepShell>
  );

  /* ======================
     主渲染
====================== */
  return (
    <div className="min-h-screen bg-gray-50">
      {step === 1 && renderScreen1()}
      {step === 2 && renderScreen2()}
      {step === 3 && renderScreen3()}
      {step === 4 && renderScreen4()}
      {step === 5 && renderScreen5()}
      {step === 6 && renderScreen6()}
    </div>
  );
}
