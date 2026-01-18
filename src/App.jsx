// ================================
// App.jsx  (PART 1 / N)
// 基础结构 + 公共组件 + NumberInput
// ================================

import React, { useState, useMemo, useEffect } from "react";

/* ======================
   工具函数
====================== */
const clamp = (v, min, max) =>
  Math.min(max, Math.max(min, v));

/* ======================
   通用 UI 组件
====================== */

// ↓↓↓ 标题统一缩小（原来的一半左右）
const StepShell = ({ title, subtitle, children }) => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-xl font-semibold mb-2">{title}</h1>
    {subtitle && (
      <div className="text-sm text-gray-600 mb-6">
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
    {hint && (
      <div className="text-xs text-gray-500 mt-1">
        {hint}
      </div>
    )}
  </div>
);

// ======================
// ✅ NumberInput（修复版）
// 关键特性：
// - 可连续输入
// - 输入时只做“字符层面控制”
// - onBlur 时才 clamp
// ======================
const NumberInput = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step,
  placeholder = "",
  className = "",
  maxDigits,
}) => {
  const [text, setText] = useState(
    value === undefined || value === null ? "" : String(value)
  );

  // 外部 value 变化时，同步到输入框
  useEffect(() => {
    if (
      value === undefined ||
      value === null ||
      String(value) === ""
    ) {
      setText("");
    } else {
      setText(String(value));
    }
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
        if (maxDigits) {
          next = next.slice(0, maxDigits);
        }
        setText(next);
      }}
      onBlur={() => {
        if (text.trim() === "") {
          onChange?.(undefined);
          return;
        }
        const n = Number(text);
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

/* ======================
   Slider（保留）
====================== */
const Slider = ({ value, onChange, min = 0, max = 100, step = 1 }) => (
  <input
    type="range"
    className="w-full"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
  />
);

/* ======================
   导航
====================== */
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
      className={`px-4 py-2 rounded-lg ${
        canNext
          ? "bg-black text-white"
          : "bg-gray-300 text-gray-500"
      }`}
      disabled={!canNext}
      onClick={() => setStep(step + 1)}
    >
      下一步
    </button>
  </div>
);

// ================================
// PART 1 结束
// ================================

// ================================
// App.jsx  (PART 2 / N)
// App 主组件 state + Screen 1
// ================================

export default function App() {
  const [step, setStep] = useState(1);

  // -----------------------
  // Screen 1：价值锚点（最多选3）
  // -----------------------
  const choices = [
    "在市场低点被迫卖资产",
    "被迫卖掉房子或核心资产",
    "被迫进入不想去的护理机构",
    "完全依赖子女或他人决策",
    "被单一合同或产品锁死选择",
    "现金流突然断裂，来不及调整",
  ];
  const [valueAnchor, setValueAnchor] = useState([]);

  // -----------------------
  // Screen 2：情景输入（基础参数）
  // -----------------------
  const nowYear = new Date().getFullYear();

  // 本人
  const [birthYear, setBirthYear] = useState(undefined);
  const [birthYearText, setBirthYearText] = useState("");

  // 性别（为后续概率模型预留）
  const [genderSelf, setGenderSelf] = useState("M"); // M/F

  // 是否考虑配偶
  const [includeSpouse, setIncludeSpouse] = useState(false);
  const [genderSpouse, setGenderSpouse] = useState("F");
  const [spouseBirthYear, setSpouseBirthYear] = useState(undefined);
  const [spouseBirthYearText, setSpouseBirthYearText] = useState("");

  // LTC 情景：1段 vs 2段（先后两人）
  const [ltcMode, setLtcMode] = useState("ONE"); // ONE / TWO

  // 起点年龄（情景开始年龄）
  const [startAge, setStartAge] = useState(85);

  // 护理持续年限（单段）
  const [durationYears, setDurationYears] = useState(5);

  // 夫妻两段间隔（年）——高级选项
  const [spouseGapYears, setSpouseGapYears] = useState(3);

  // 当前年度 LTC 成本（按今天价格）
  const [annualCostToday, setAnnualCostToday] = useState(300000);

  // 成本年化增长率（通胀/护理成本增长）——高级选项
  const [costGrowthPct, setCostGrowthPct] = useState(3); // %

  // -----------------------
  // 派生：年龄（仅用于展示）
  // -----------------------
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

  // -----------------------
  // Screen 1
  // -----------------------
  const Screen1 = () => (
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
                active
                  ? "border-black bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setValueAnchor((prev) => {
                  // 已选 -> 取消
                  if (prev.includes(c)) {
                    return prev.filter((x) => x !== c);
                  }
                  // 未选 -> 若已满3则不加
                  if (prev.length >= 3) return prev;
                  return [...prev, c];
                });
              }}
            >
              <div className="text-sm font-medium flex items-center justify-between">
                <span>{c}</span>
                {/* ✅ 只保留一个勾：放在右侧 */}
                {active && <span className="text-lg">✅</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {active ? "已选择（可再次点击取消）" : "点击选择"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-600">
        已选：{valueAnchor.length} / 3
      </div>

      <Nav
        step={step}
        setStep={setStep}
        canNext={valueAnchor.length >= 1}
      />
    </StepShell>
  );

  // ================================
  // PART 2 结束
  // 下一段会继续：Screen 2（含性别/1段2段选择可见、起点成本按通胀推算）
  // ================================

// ================================
// App.jsx  (PART 3 / N)
// Screen 2
// ================================

  // -----------------------
  // Screen 2：辅助：四位出生年输入（不卡顿）
  // -----------------------
  const YearInput = ({
    valueText,
    setValueText,
    setYearNumber,
    placeholder = "例如：1957",
  }) => (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      className="w-full rounded-xl border px-3 py-2 text-base"
      value={valueText}
      onChange={(e) => {
        // 允许连续输入：只保留数字，最多4位
        const next = e.target.value.replace(/\D/g, "").slice(0, 4);
        setValueText(next);
      }}
      onBlur={() => {
        // 离开输入框时才“落地”为数字year
        if (!valueText) {
          setYearNumber(undefined);
          return;
        }
        const n = Number(valueText);
        if (Number.isFinite(n) && n >= 1900 && n <= nowYear) {
          setYearNumber(n);
        } else {
          setYearNumber(undefined);
        }
      }}
    />
  );

  // -----------------------
  // Screen 2：派生：起点年龄时的 LTC 年度成本（按通胀/增长推算）
  // 逻辑：从“今天年龄”推到“情景起点年龄”
  // yearsToStart = startAge - currentAge（若没输入年龄则当0）
  // startAnnualCost = annualCostToday * (1 + g) ^ yearsToStart
  // -----------------------
  const costGrowth = useMemo(
    () => clamp(Number(costGrowthPct) / 100, 0, 0.15),
    [costGrowthPct]
  );

  const yearsToStart = useMemo(() => {
    const ca = currentAge ?? null;
    if (!ca) return 0;
    return Math.max(0, Number(startAge) - Number(ca));
  }, [currentAge, startAge]);

  const annualCostAtStart = useMemo(() => {
    const base = Number(annualCostToday) || 0;
    return Math.round(base * Math.pow(1 + costGrowth, yearsToStart));
  }, [annualCostToday, costGrowth, yearsToStart]);

  // -----------------------
  // Screen 2：按钮组（可见的选择结果：高亮 + ✅）
  // -----------------------
  const ChoicePills = ({ value, onChange, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-2 text-sm transition flex items-center gap-2 ${
              active ? "border-black bg-gray-50" : "hover:bg-gray-50"
            }`}
            type="button"
          >
            <span>{opt.label}</span>
            {active && <span>✅</span>}
          </button>
        );
      })}
    </div>
  );

  // -----------------------
  // Screen 2
  // -----------------------
  const Screen2 = () => (
    <StepShell
      title="建立你的压力测试基准"
      subtitle="我们先不预测概率，只把情景参数跑通。这里的性别、配偶等参数为后续引入数据模型做准备。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="你的出生年份（YYYY）" hint="用于计算当前年龄；输入4位后即可。">
            <YearInput
              valueText={birthYearText}
              setValueText={setBirthYearText}
              setYearNumber={setBirthYear}
            />
            <div className="text-xs text-gray-600 mt-2">
              当前年龄：{currentAge ? `${currentAge} 岁` : "（请先输入有效出生年份）"}
            </div>
          </Field>

          <Field label="你的性别（为后续概率模型预留）" hint="目前不进入计算，仅用于后续扩展。">
            <ChoicePills
              value={genderSelf}
              onChange={setGenderSelf}
              options={[
                { value: "M", label: "男" },
                { value: "F", label: "女" },
              ]}
            />
          </Field>

          <Field
            label="是否考虑配偶"
            hint="选择后可输入配偶年龄与性别；并可选择1段/2段 LTC 情景。"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  includeSpouse ? "border-black bg-gray-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setIncludeSpouse(true)}
              >
                考虑配偶 {includeSpouse && "✅"}
              </button>
              <button
                type="button"
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  !includeSpouse ? "border-black bg-gray-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setIncludeSpouse(false)}
              >
                不考虑配偶 {!includeSpouse && "✅"}
              </button>
            </div>

            {includeSpouse && (
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">配偶出生年份（YYYY）</div>
                  <YearInput
                    valueText={spouseBirthYearText}
                    setValueText={setSpouseBirthYearText}
                    setYearNumber={setSpouseBirthYear}
                    placeholder="例如：1959"
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
          <Field label="情景：LTC 发生方式" hint="用于后续“仅一人” vs “两人先后”结构。">
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
            <NumberInput
              value={startAge}
              onChange={(v) => setStartAge(clamp(v, 40, 110))}
              min={40}
              max={110}
              step={1}
            />
          </Field>

          <Field label="单段护理持续年限" hint="默认 5 年。">
            <NumberInput
              value={durationYears}
              onChange={(v) => setDurationYears(clamp(v, 1, 20))}
              min={1}
              max={20}
              step={1}
            />
          </Field>

          <Field label="高级：成本年化增长率（%）" hint="用于把“今天的年度成本”推到“情景起点年龄”的成本。">
            <NumberInput
              value={costGrowthPct}
              onChange={(v) => setCostGrowthPct(clamp(v, 0, 15))}
              min={0}
              max={15}
              step={0.5}
            />
          </Field>

          {includeSpouse && ltcMode === "TWO" && (
            <Field label="高级：两人发生间隔（年）" hint="仅在“两段”情景下使用。">
              <NumberInput
                value={spouseGapYears}
                onChange={(v) => setSpouseGapYears(clamp(v, 0, 20))}
                min={0}
                max={20}
                step={1}
              />
            </Field>
          )}

          <Field label="LTC 年度成本（按今天价格）" hint="输入今天的年度成本；系统会按增长率推算到情景起点年龄。">
            <NumberInput
              value={annualCostToday}
              onChange={(v) => setAnnualCostToday(clamp(v, 50000, 2000000))}
              min={50000}
              max={2000000}
              step={1000}
            />
            <div className="text-xs text-gray-600 mt-2">
              推算到情景起点年龄（{startAge} 岁）的年度成本 ≈{" "}
              <span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
              {currentAge ? (
                <span className="text-gray-500">
                  {" "}
                  （从当前年龄 {currentAge} 岁推 {yearsToStart} 年）
                </span>
              ) : (
                <span className="text-gray-500">（未输入出生年时默认不外推）</span>
              )}
            </div>
          </Field>
        </div>
      </div>

      <Nav
        step={step}
        setStep={setStep}
        canNext={true}
      />
    </StepShell>
  );

  // ================================
  // PART 3 结束
  // 下一段将继续：Screen 3 / 4（资产、合同等输入）
  // ================================

// ================================
// App.jsx  (PART 4 / N)
// Screen 3 + Screen 4
// ================================

  // -----------------------
  // Screen 3：可用资金（缓冲池）& 未来补充
  // -----------------------
  const Screen3 = () => (
    <StepShell
      title="哪些钱，真的能在压力时刻用上？"
      subtitle="我们只计算你愿意、也能快速动用的部分：现金/可变现资产 + 未来计划补充。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field
            label="当前可用缓冲池（两人合计）"
            hint="例如：现金 + 可快速变现的投资账户。"
          >
            <NumberInput
              value={currentPool}
              onChange={(v) => setCurrentPool(clamp(v, 0, 50000000))}
              min={0}
              max={50000000}
              step={1000}
            />
            <div className="text-xs text-gray-600 mt-2">
              当前缓冲池：<span className="font-semibold">{fmtUSD(currentPool)}</span>
            </div>
          </Field>

          <Field
            label="每年可追加投入（两人合计）"
            hint="例如：每年愿意从现金流/再平衡中追加到“LTC缓冲池”的金额。"
          >
            <NumberInput
              value={annualContribution}
              onChange={(v) => setAnnualContribution(clamp(v, 0, 5000000))}
              min={0}
              max={5000000}
              step={1000}
            />
          </Field>

          <Field label="追加投入年数" hint="例如：投入 10 年。">
            <NumberInput
              value={contributionYears}
              onChange={(v) => setContributionYears(clamp(v, 0, 40))}
              min={0}
              max={40}
              step={1}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Field
            label="缓冲池净回报（%）"
            hint="工程假设：净回报 = 税后/费用后。后续可更细。"
          >
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
              Screen 2 已经把 LTC 成本按增长率推算到“情景起点年龄”。
              因此这里的回报只用于估算“缓冲池资产增长”，不会重复叠加通胀到成本。
            </div>
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext={true} />
    </StepShell>
  );

  // -----------------------
  // Screen 4：合同/福利（Plan A 基础）
  // -----------------------
  const Screen4 = () => (
    <StepShell
      title="合同/福利：你希望“确定性覆盖”多少？"
      subtitle="先用工程参数描述：若发生 LTC，每年可由合同/福利支付多少、持续多少年。"
    >
      <div className="space-y-4">
        <Field label="是否已有 LTC 合同 / 福利来源？" hint="例如：LTC保单、雇主福利、年金/Life+LTC rider 等。">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm transition ${
                hasContract ? "border-black bg-gray-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setHasContract(true)}
            >
              有 {hasContract && "✅"}
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm transition ${
                !hasContract ? "border-black bg-gray-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setHasContract(false)}
            >
              暂无 {!hasContract && "✅"}
            </button>
          </div>
        </Field>

        {hasContract ? (
          <div className="grid md:grid-cols-2 gap-5">
            <Field
              label="合同/福利：每年可支付金额（按情景起点年的价格）"
              hint="注意：Screen 2 已把 LTC 成本外推到起点年龄；这里直接填“起点年对应的合同年给付”。"
            >
              <NumberInput
                value={annualContractBenefit}
                onChange={(v) => setAnnualContractBenefit(clamp(v, 0, 2000000))}
                min={0}
                max={2000000}
                step={1000}
              />
            </Field>

            <Field label="合同/福利可支付年数" hint="例如：6 年。">
              <NumberInput
                value={contractBenefitYears}
                onChange={(v) => setContractBenefitYears(clamp(v, 0, 30))}
                min={0}
                max={30}
                step={1}
              />
            </Field>

            <div className="md:col-span-2 rounded-2xl border p-4 bg-gray-50">
              <div className="text-sm font-semibold mb-1">小结</div>
              <div className="text-xs text-gray-700 leading-relaxed">
                你的合同/福利在情景开始后，最多可覆盖：
                <span className="font-semibold">
                  {" "}
                  {fmtUSD(annualContractBenefit)} × {contractBenefitYears} 年
                </span>
                。后面我们会与“成本路径”叠加，看缺口由缓冲池承担多少。
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border p-4 bg-gray-50 text-xs text-gray-700 leading-relaxed">
            你选择“暂无合同/福利”。后续计算会默认：合同覆盖 = 0，全由缓冲池承担（或你可在 Screen 5/6 中模拟不同方案）。
          </div>
        )}
      </div>

      <Nav step={step} setStep={setStep} canNext={true} />
    </StepShell>
  );

  // ================================
  // PART 4 结束
  // 下一段将继续：Screen 5（缓冲系数的统一解释/去通胀） + Screen 6（柱状图/Plan B&C 开关生效/去掉无功能按钮）
  // ================================

// ================================
// App.jsx  (PART 5 / N)
// 补齐 state + 计算 + Screen 5（缓冲系数口径统一）
// ================================

  // -----------------------
  // Screen 3/4 需要的 state（前面还没定义完，这里补齐）
  // -----------------------
  const [currentPool, setCurrentPool] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [contributionYears, setContributionYears] = useState(10);
  const [netReturnChoice, setNetReturnChoice] = useState("3.0"); // %

  const [hasContract, setHasContract] = useState(false);
  const [annualContractBenefit, setAnnualContractBenefit] = useState(138000);
  const [contractBenefitYears, setContractBenefitYears] = useState(6);

  // -----------------------
  // Screen 5：缓冲系数（不含通胀）
  // 解释口径：
  // - 成本通胀/增长：已在 Screen2 通过 costGrowthPct 推到“起点年龄年度成本”并生成成本路径
  // - 缓冲系数：只代表“非通胀的不确定性” (摩擦/升级/额外服务/家庭决策成本等)
  //   因此前面已考虑通胀后，这里不要再把通胀重复算进去
  // -----------------------
  const [bufferPct, setBufferPct] = useState(15); // 默认 15%

  // Plan B / C（在 Screen6 会让它们“真的起作用”）
  const [planBOn, setPlanBOn] = useState(false);
  const [planBExtraPool, setPlanBExtraPool] = useState(250000); // 例如“可额外变现/借贷”一次性
  const [planCOn, setPlanCOn] = useState(false);
  const [planCCostCutPct, setPlanCCostCutPct] = useState(10); // 例如“居家/技术/流程优化”降低成本

  // -----------------------
  // 格式化
  // -----------------------
  const fmtUSD = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "$0";
    return v.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  // -----------------------
  // 资金池 FV：从现在推到“情景起点年龄”
  // - contributions 只发生 contributionYears 年（不能超过 yearsToStart）
  // -----------------------
  const netReturn = useMemo(() => clamp(Number(netReturnChoice) / 100, 0, 0.12), [netReturnChoice]);

  const contribYearsEff = useMemo(() => {
    return Math.max(0, Math.min(Number(contributionYears) || 0, yearsToStart));
  }, [contributionYears, yearsToStart]);

  const poolAtStart = useMemo(() => {
    // 用循环：更直观，也便于后续做“每年现金流”图
    let pool = Number(currentPool) || 0;
    const r = netReturn;

    for (let y = 1; y <= yearsToStart; y++) {
      // 年初/年中收益近似：先增长
      pool = pool * (1 + r);
      // 追加投入：只在前 contribYearsEff 年发生（近似年末投入）
      if (y <= contribYearsEff) pool += Number(annualContribution) || 0;
    }
    // Plan B 的额外池：在情景开始时一次性注入（仅当开启）
    if (planBOn) pool += Number(planBExtraPool) || 0;

    return Math.round(pool);
  }, [
    currentPool,
    annualContribution,
    yearsToStart,
    contribYearsEff,
    netReturn,
    planBOn,
    planBExtraPool,
  ]);

  // -----------------------
  // 成本路径：从情景开始后逐年增长
  // - annualCostAtStart：已在 Screen2 由 todayCost + costGrowth 推算得到
  // - TWO 情景：第二段从 spouseGapYears 开始，持续 durationYears
  // - planC：降低成本（例如居家/技术/流程优化）——作为占位功能
  // - bufferPct：非通胀不确定性，仅作为额外乘数
  // -----------------------
  const bufferMultiplier = useMemo(() => 1 + (Number(bufferPct) || 0) / 100, [bufferPct]);

  const effectiveCostCut = useMemo(() => {
    if (!planCOn) return 1;
    return 1 - clamp((Number(planCCostCutPct) || 0) / 100, 0, 0.5);
  }, [planCOn, planCCostCutPct]);

  const ltcHorizonYears = useMemo(() => {
    if (ltcMode === "ONE") return Number(durationYears) || 0;
    // TWO：第二段开始于 gap，持续 duration
    return (Number(spouseGapYears) || 0) + (Number(durationYears) || 0);
  }, [ltcMode, spouseGapYears, durationYears]);

  // 每年总 LTC 成本（情景开始后的第 1 年为 index 0）
  const ltcCostSeries = useMemo(() => {
    const g = costGrowth; // 已是小数
    const base = Number(annualCostAtStart) || 0;
    const dur = Number(durationYears) || 0;
    const gap = Number(spouseGapYears) || 0;

    const years = Math.max(0, ltcHorizonYears);
    const arr = [];

    for (let t = 0; t < years; t++) {
      let cost = 0;

      // 第一段：t = 0..dur-1
      if (t >= 0 && t < dur) {
        cost += base * Math.pow(1 + g, t);
      }

      // 第二段：仅 TWO + includeSpouse 才启用
      if (includeSpouse && ltcMode === "TWO") {
        const t2 = t - gap;
        if (t2 >= 0 && t2 < dur) {
          // 第二段从 gap 年开始，成本也从 base*(1+g)^gap 起跳（即与时间一致）
          cost += base * Math.pow(1 + g, t);
        }
      }

      // 套用 Plan C 成本降低（占位功能）
      cost = cost * effectiveCostCut;

      // 套用缓冲系数（非通胀不确定性）
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

  // -----------------------
  // Screen 5：缓冲系数（不含通胀）
  // -----------------------
  const Screen5 = () => (
    <StepShell
      title="缓冲系数（不含通胀）"
      subtitle="通胀/护理成本增长已经在 Screen 2 进入“成本路径”。这里的缓冲只覆盖：护理升级、额外服务、家庭决策摩擦等非通胀不确定性。"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field
            label="缓冲比例（%）"
            hint="建议 0%–30%。这不是通胀，而是“额外不确定性”的保护垫。"
          >
            <NumberInput
              value={bufferPct}
              onChange={(v) => setBufferPct(clamp(v ?? 0, 0, 50))}
              min={0}
              max={50}
              step={1}
            />
          </Field>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">口径解释（非常重要）</div>
            <div className="text-xs text-gray-700 leading-relaxed space-y-2">
              <div>
                <span className="font-semibold">成本增长率（Screen 2）</span>：把“今天的年度成本”
                推到“情景起点年龄”的年度成本，并形成逐年增长的成本路径。
              </div>
              <div>
                <span className="font-semibold">缓冲比例（本页）</span>：在上述成本路径基础上额外乘以
                <span className="font-semibold">（1 + 缓冲比例）</span>，用于覆盖“非通胀的不确定性”。
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-semibold mb-2">当前缓冲系数</div>
            <div className="text-2xl font-semibold">{bufferMultiplier.toFixed(2)}x</div>
            <div className="text-xs text-gray-600 mt-2">
              关系：缓冲倍数 = 1 + 缓冲比例/100
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-sm font-semibold mb-1">示例（按你当前参数）</div>
            <div className="text-xs text-gray-700 leading-relaxed">
              情景起点年龄年度成本 ≈ <span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
              <br />
              加入缓冲后（首年）≈{" "}
              <span className="font-semibold">
                {fmtUSD(Math.round((annualCostAtStart || 0) * bufferMultiplier * effectiveCostCut))}
              </span>
              {planCOn ? (
                <span className="text-gray-500">（含 Plan C 成本降低）</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext={true} />
    </StepShell>
  );

  // ================================
  // PART 5 结束
  // 下一段（PART 6）将包含：
  // - Screen 6：年度柱状图（总资产/合同/缓冲池支出）
  // - Plan B / C 变成“有明确作用”的开关（含输入）
  // - 去掉 Screen6 无意义的“下一步”
  // - 最终 return 渲染 + 关闭 App() 大括号
  // ================================

// ================================
// App.jsx  (PART 6 / N)
// Screen 6（棒图 + Plan B/C 生效） + 最终 return
// ================================

  // -----------------------
  // 合同/福利序列（情景开始后逐年）
  // - 这里假设合同给付是固定“起点年价格”的名义金额（不再自动通胀）
  // - 你若未来要给合同加 COLA，可在这里加 growth
  // -----------------------
  const contractSeries = useMemo(() => {
    const years = Math.max(0, ltcHorizonYears);
    const arr = [];
    for (let t = 0; t < years; t++) {
      if (!hasContract) {
        arr.push(0);
      } else {
        arr.push(t < (Number(contractBenefitYears) || 0) ? (Number(annualContractBenefit) || 0) : 0);
      }
    }
    return arr;
  }, [ltcHorizonYears, hasContract, annualContractBenefit, contractBenefitYears]);

  // -----------------------
  // 资产演化：从情景开始后每年
  // 规则：
  // - 年初资产 = 上年末资产
  // - 当年支出 = max(0, LTC成本 - 合同支付)
  // - 年末资产 = (年初资产 - 当年支出) * (1 + netReturn)
  // -----------------------
  const timeline = useMemo(() => {
    const years = Math.max(0, ltcHorizonYears);
    let assets = Number(poolAtStart) || 0;
    const r = netReturn;

    const rows = [];
    for (let t = 0; t < years; t++) {
      const cost = ltcCostSeries[t] || 0;
      const contract = contractSeries[t] || 0;

      const outOfPocket = Math.max(0, cost - contract);
      const startAssets = assets;

      // 支付
      assets = Math.max(0, assets - outOfPocket);

      // 年末增长（若资产为0则不增长）
      assets = assets * (1 + r);

      rows.push({
        yearIndex: t + 1,
        startAssets: Math.round(startAssets),
        ltcCost: Math.round(cost),
        contract: Math.round(contract),
        outOfPocket: Math.round(outOfPocket),
        endAssets: Math.round(assets),
      });
    }
    return rows;
  }, [ltcHorizonYears, poolAtStart, netReturn, ltcCostSeries, contractSeries]);

  // 缺口：如果任何一年 outOfPocket > startAssets 则代表当年撑不住
  const worstShortfall = useMemo(() => {
    let worst = 0;
    for (const row of timeline) {
      const short = Math.max(0, row.outOfPocket - row.startAssets);
      worst = Math.max(worst, short);
    }
    return Math.round(worst);
  }, [timeline]);

  // 为棒图选一个 scale：取每年最大的“总成本”与“资产”共同决定
  const chartMax = useMemo(() => {
    let m = 1;
    for (const row of timeline) {
      m = Math.max(m, row.startAssets, row.ltcCost);
    }
    return m;
  }, [timeline]);

  const BarRow = ({ label, a, b, c, maxValue }) => {
    // a=合同，b=自付，c=剩余资产（用于视觉）
    const toPct = (x) => `${(100 * (x / maxValue)).toFixed(2)}%`;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <div>{label}</div>
          <div className="tabular-nums">
            合同 {fmtUSD(a)} · 自付 {fmtUSD(b)} · 期初资产 {fmtUSD(c + b)}
          </div>
        </div>
        <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden flex">
          <div
            className="h-full bg-blue-400"
            style={{ width: toPct(a) }}
            title={`合同/福利：${fmtUSD(a)}`}
          />
          <div
            className="h-full bg-red-400"
            style={{ width: toPct(b) }}
            title={`自付（缓冲池支付）：${fmtUSD(b)}`}
          />
          <div
            className="h-full bg-green-400"
            style={{ width: toPct(c) }}
            title={`支付后剩余资产（期初 - 自付）：${fmtUSD(c)}`}
          />
        </div>
      </div>
    );
  };

  // -----------------------
  // Screen 6
  // -----------------------
  const Screen6 = () => (
    <StepShell
      title="结果摘要（含年度棒图）"
      subtitle="下面按“情景开始后逐年”展示：合同/福利支付、自付（缓冲池支付）、以及支付后剩余资产。"
    >
      <div className="rounded-2xl border p-4 bg-gray-50 mb-5">
        <div className="text-xs text-gray-600">
          情景：{includeSpouse ? (ltcMode === "TWO" ? "夫妻先后两人（两段）" : "仅一人（单段）") : "仅本人（不含配偶）"}
          {" · "}
          成本增长率：{costGrowthPct}%{" · "}
          缓冲比例：{bufferPct}%（缓冲倍数 {bufferMultiplier.toFixed(2)}x，不含通胀）
        </div>
        <div className="text-xs text-gray-600 mt-1">
          起点年龄年度成本（已含通胀推算）：<span className="font-semibold">{fmtUSD(annualCostAtStart)}</span>
          {includeSpouse && ltcMode === "TWO" ? (
            <>；两人间隔 {spouseGapYears} 年</>
          ) : null}
        </div>
      </div>

      {/* Plan B / C（现在真的有作用） */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold mb-2">Plan B：起点时额外可动用资金（一次性）</div>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm ${planBOn ? "border-black bg-gray-50" : "hover:bg-gray-50"}`}
              onClick={() => setPlanBOn(true)}
            >
              开启 {planBOn && "✅"}
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm ${!planBOn ? "border-black bg-gray-50" : "hover:bg-gray-50"}`}
              onClick={() => setPlanBOn(false)}
            >
              关闭 {!planBOn && "✅"}
            </button>
          </div>
          {planBOn && (
            <Field label="Plan B 额外池（起点一次性注入）" hint="例如：可变现资产、反向抵押、家庭支持等。">
              <NumberInput
                value={planBExtraPool}
                onChange={(v) => setPlanBExtraPool(clamp(v ?? 0, 0, 5000000))}
                min={0}
                max={5000000}
                step={1000}
              />
            </Field>
          )}
          <div className="text-xs text-gray-600 mt-3">
            作用：会直接增加“情景开始时的可动用资金池”，从而提高每年可承受的自付能力。
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold mb-2">Plan C：降低 LTC 成本（占位功能）</div>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm ${planCOn ? "border-black bg-gray-50" : "hover:bg-gray-50"}`}
              onClick={() => setPlanCOn(true)}
            >
              开启 {planCOn && "✅"}
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-sm ${!planCOn ? "border-black bg-gray-50" : "hover:bg-gray-50"}`}
              onClick={() => setPlanCOn(false)}
            >
              关闭 {!planCOn && "✅"}
            </button>
          </div>
          {planCOn && (
            <Field
              label="成本降低比例（%）"
              hint="例如：居家照护优化、技术辅助、家庭排班、服务组合优化等。"
            >
              <NumberInput
                value={planCCostCutPct}
                onChange={(v) => setPlanCCostCutPct(clamp(v ?? 0, 0, 50))}
                min={0}
                max={50}
                step={1}
              />
            </Field>
          )}
          <div className="text-xs text-gray-600 mt-3">
            作用：会将每年的 LTC 成本按比例降低（在缓冲系数之后统一进入成本路径）。
          </div>
        </div>
      </div>

      {/* 关键摘要 */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-600">情景开始时可动用资金池（含 Plan B）</div>
          <div className="text-lg font-semibold mt-1">{fmtUSD(poolAtStart)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-600">最坏年度缺口（当年撑不住的缺口）</div>
          <div className={`text-lg font-semibold mt-1 ${worstShortfall > 0 ? "text-red-600" : ""}`}>
            {fmtUSD(worstShortfall)}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-600">情景年数（两段合并）</div>
          <div className="text-lg font-semibold mt-1">{ltcHorizonYears} 年</div>
        </div>
      </div>

      {/* 棒图 */}
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-2">年度棒图（合同/自付/剩余资产）</div>
        <div className="text-xs text-gray-600 mb-4">
          蓝：合同/福利；红：自付（缓冲池支付）；绿：支付后剩余资产（相对尺度：按每年最大值归一）
        </div>

        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className="text-xs text-gray-600">（当前情景年数为 0）</div>
          ) : (
            timeline.map((row) => (
              <BarRow
                key={row.yearIndex}
                label={`第 ${row.yearIndex} 年`}
                a={row.contract}
                b={row.outOfPocket}
                c={Math.max(0, row.startAssets - row.outOfPocket)}
                maxValue={chartMax}
              />
            ))
          )}
        </div>
      </div>

      {/* 表格（可选，帮助核对） */}
      <div className="rounded-2xl border p-4 mt-6">
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
                  <td className="py-2 px-2 text-right tabular-nums">{fmtUSD(r.outOfPocket)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{fmtUSD(r.endAssets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最后一页：不再显示“下一步”，只保留重新测试 */}
      <div className="flex justify-end mt-8">
        <button
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          onClick={() => setStep(1)}
        >
          回到第 1 步重新测试
        </button>
      </div>
    </StepShell>
  );

  // -----------------------
  // 最终渲染（注意：这里用函数调用，不用 <ScreenX/>，避免输入框丢焦点）
  // -----------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {step === 1 && Screen1()}
      {step === 2 && Screen2()}
      {step === 3 && Screen3()}
      {step === 4 && Screen4()}
      {step === 5 && Screen5()}
      {step === 6 && Screen6()}
    </div>
  );
}
// ================================
// END OF App.jsx
// ================================
