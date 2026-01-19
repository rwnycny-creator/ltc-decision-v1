import React, { useMemo, useState, useEffect } from "react";

/**
 * Helpers
 */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const fmtUSD = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const safeNum = (x, fallback = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * UI primitives
 */

const StepShell = ({ title, subtitle, children }) => {
  // 你说“标题太大，希望约一半”：这里直接把标题/副标题整体缩小一档
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <div className="text-xs md:text-sm text-gray-600 mt-2 leading-relaxed">{subtitle}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div>
    <div className="text-sm font-medium">{label}</div>
    {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    <div className="mt-2">{children}</div>
  </div>
);

// 单选/多选 pill（用在 Screen2 的“性别”“一段/两段”）
const ChoicePills = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-xl border text-sm transition ${
            active ? "border-black bg-gray-100" : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left transition ${
      checked ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
    }`}
  >
    <div className="text-sm font-medium">{label}</div>
    <div
      className={`h-6 w-10 rounded-full relative transition ${checked ? "bg-black" : "bg-gray-300"}`}
      aria-hidden="true"
    >
      <div
        className={`h-5 w-5 bg-white rounded-full absolute top-0.5 transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </div>
  </button>
);

/**
 * NumberInput
 * - 允许连续输入（不会每输一位就被 clamp）
 * - 失焦时再 clamp
 * - 外部 value 改变时同步显示
 */
const NumberInput = ({ value, onChange, min = 0, max = 1e12, step, placeholder = "", className = "" }) => {
  const [text, setText] = useState(value ?? "");

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      className={`w-full rounded-xl border px-3 py-2 text-base ${className}`}
      value={String(text)}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, "");
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

const Nav = ({ step, setStep, canNext = true, canPrev = true, nextLabel = "下一步", prevLabel = "上一步" }) => (
  <div className="mt-6 flex items-center justify-between">
    <button
      type="button"
      disabled={!canPrev || step <= 1}
      onClick={() => setStep((s) => Math.max(1, s - 1))}
      className={`px-4 py-2 rounded-xl border text-sm ${
        !canPrev || step <= 1 ? "text-gray-400 border-gray-200" : "hover:bg-gray-50 border-gray-300"
      }`}
    >
      {prevLabel}
    </button>

    <button
      type="button"
      disabled={!canNext}
      onClick={() => setStep((s) => s + 1)}
      className={`px-4 py-2 rounded-xl text-sm ${
        canNext ? "bg-black text-white hover:opacity-90" : "bg-gray-200 text-gray-500"
      }`}
    >
      {nextLabel}
    </button>
  </div>
);

/**
 * App
 */
export default function App() {
  const [step, setStep] = useState(1);

  // Screen 1 choices
  const choices = [
    "在市场低点被迫卖资产",
    "被迫卖掉房子或核心资产",
    "被迫进入不想去的护理机构",
    "完全依赖子女或他人决策",
    "被单一合同或产品锁死选择",
    "现金流突然断裂，来不及调整",
  ];
  const [valueAnchor, setValueAnchor] = useState([]);

  // Screen2: birth year + scenario
  const nowYear = new Date().getFullYear();
  const [birthYear, setBirthYear] = useState(undefined); // number
  const [birthYearText, setBirthYearText] = useState(""); // string typed
  const currentAge = useMemo(() => {
    const y = birthYear ?? Number(birthYearText);
    if (!Number.isFinite(y) || y < 1900 || y > nowYear) return 0;
    return nowYear - y;
  }, [birthYear, birthYearText, nowYear]);

  // Scenario params
  const [sex, setSex] = useState("M"); // M/F
  const [includeSpouse, setIncludeSpouse] = useState(true);
  const [spouseSex, setSpouseSex] = useState("F");
  const [spouseBirthYearText, setSpouseBirthYearText] = useState("");
  const spouseAge = useMemo(() => {
    const y = Number(spouseBirthYearText);
    if (!Number.isFinite(y) || y < 1900 || y > nowYear) return 0;
    return nowYear - y;
  }, [spouseBirthYearText, nowYear]);

  const [scenarioType, setScenarioType] = useState("ONE"); // ONE or TWO
  const [startAge, setStartAge] = useState(85);
  const [durationYears, setDurationYears] = useState(5);

  // Advanced options requested
  const [spouseGapYears, setSpouseGapYears] = useState(3); // 两人发生间隔（年）
  const [costInflationPct, setCostInflationPct] = useState(3); // 成本年化增长率（%）

  // LTC cost today
  const [annualCostToday, setAnnualCostToday] = useState(300000);

  // Screen3: assets / pool etc
  const [currentPool, setCurrentPool] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [contributionYears, setContributionYears] = useState(10);
  const [netReturnChoice, setNetReturnChoice] = useState("3.0");
  const netReturn = useMemo(() => clamp(Number(netReturnChoice) / 100, 0, 0.08), [netReturnChoice]);

  // Plan contract
  const [hasContract, setHasContract] = useState(false);
  const [annualContractBenefit, setAnnualContractBenefit] = useState(138000);
  const [contractBenefitYears, setContractBenefitYears] = useState(6);

  // Buffer
  const [techBufferPct, setTechBufferPct] = useState(18);

  // Plan toggles (说明用，后续再赋真正功能)
  const [planBOn, setPlanBOn] = useState(false);
  const [planCOn, setPlanCOn] = useState(true);

  /**
   * Basic finance
   */
  const fv = useMemo(() => {
    const principal = safeNum(currentPool);
    const contrib = safeNum(annualContribution);
    const years = Math.max(0, safeNum(contributionYears));
    const r = safeNum(netReturn, 0);

    // FV of principal
    let total = principal * Math.pow(1 + r, years);
    // FV of annuity (end of year contributions)
    if (r === 0) total += contrib * years;
    else total += contrib * ((Math.pow(1 + r, years) - 1) / r);
    return Math.max(0, total);
  }, [currentPool, annualContribution, contributionYears, netReturn]);

  /**
   * Screen2 derived “工程假设”：把 today cost 用通胀推到“情景起点年龄”
   * 这里先用 (startAge - currentAge) 年做推演（没有外部数据也能跑通）
   */
  const yearsToStart = Math.max(0, safeNum(startAge) - safeNum(currentAge));
  const inflatedAnnualCostAtStart = useMemo(() => {
    const g = clamp(safeNum(costInflationPct) / 100, 0, 0.15);
    return annualCostToday * Math.pow(1 + g, yearsToStart);
  }, [annualCostToday, costInflationPct, yearsToStart]);

  // Total cost (simplified)
  const totalLtcYears = useMemo(() => {
    if (!includeSpouse) return durationYears;
    if (scenarioType === "ONE") return durationYears;
    // TWO: 两段相加
    return durationYears * 2;
  }, [includeSpouse, scenarioType, durationYears]);

  const totalCostAtStart = useMemo(() => {
    // 这里先用“起点年成本 × 年数”做压力测试骨架
    // 更精细的“逐年递增/两段间隔”后面再做
    return inflatedAnnualCostAtStart * safeNum(totalLtcYears);
  }, [inflatedAnnualCostAtStart, totalLtcYears]);

  const bufferAmount = useMemo(() => {
    // Screen5：缓冲比例/倍数/系数关系说明：这里统一用“缓冲比例 techBufferPct”作为系数
    // 你指出前面已计入通胀，因此这里不再引入通胀，仅对成本做额外安全边际
    return totalCostAtStart * (clamp(safeNum(techBufferPct) / 100, 0, 1));
  }, [totalCostAtStart, techBufferPct]);

  /**
   * Screens
   */

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
              type="button"
              className={`text-left rounded-2xl border p-4 hover:bg-gray-50 transition ${
                active ? "border-black bg-gray-50" : ""
              }`}
              onClick={() => {
                setValueAnchor((prev) => {
                  if (prev.includes(c)) return prev.filter((x) => x !== c);
                  if (prev.length >= 3) return prev;
                  return [...prev, c];
                });
              }}
            >
              <div className="text-sm font-medium flex items-center justify-between">
                <span>{c}</span>
                {/* 只保留一个 ✅（右上角） */}
                {active ? <span aria-label="selected">✅</span> : null}
              </div>
              <div className="text-xs text-gray-500 mt-1">{active ? "已选择（再点可取消）" : "点击选择"}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500">已选：{valueAnchor.length} / 3</div>

      <Nav step={step} setStep={setStep} canNext={valueAnchor.length >= 1} />
    </StepShell>
  );

  const Screen2 = () => (
    <StepShell
      title="建立你的压力测试基准"
      subtitle="我们不预测概率，只测试后果。先设定一个你希望一定能扛住的情景。"
    >
      <div className="grid md:grid-cols-3 gap-5">
        <Field label="出生年份（YYYY）" hint="用于自动计算当前年龄（连续输入 4 位）。">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-xl border px-3 py-2 text-base"
            placeholder="例如：1957"
            value={birthYearText}
            onChange={(e) => {
              // 只允许数字，最多 4 位 —— 不会失焦，可连续输入
              const next = e.target.value.replace(/\D/g, "").slice(0, 4);
              setBirthYearText(next);
            }}
            onBlur={() => {
              const n = Number(birthYearText);
              if (Number.isFinite(n) && n >= 1900 && n <= nowYear) setBirthYear(n);
              else setBirthYear(undefined);
            }}
          />
          <div className="text-xs text-gray-500 mt-2">
            自动计算当前年龄：{currentAge > 0 ? `${currentAge} 岁` : "（请输入正确出生年份）"}
          </div>
        </Field>

        <Field label="性别（用于后续概率模型预留）" hint="当前 v1 暂不用于计算，只做参数占位。">
          <ChoicePills
            value={sex}
            onChange={setSex}
            options={[
              { label: "男", value: "M" },
              { label: "女", value: "F" },
            ]}
          />
          <div className="text-xs text-gray-500 mt-2">已选：{sex === "M" ? "男" : "女"}</div>
        </Field>

        <Field label="是否考虑配偶" hint="用于后续模型：一人/两人先后发生。">
          <Toggle checked={includeSpouse} onChange={setIncludeSpouse} label={includeSpouse ? "考虑配偶" : "不考虑配偶"} />
        </Field>
      </div>

      {includeSpouse ? (
        <div className="grid md:grid-cols-3 gap-5 mt-5">
          <Field label="配偶性别" hint="占位参数。">
            <ChoicePills
              value={spouseSex}
              onChange={setSpouseSex}
              options={[
                { label: "男", value: "M" },
                { label: "女", value: "F" },
              ]}
            />
            <div className="text-xs text-gray-500 mt-2">已选：{spouseSex === "M" ? "男" : "女"}</div>
          </Field>

          <Field label="配偶出生年（YYYY）" hint="连续输入 4 位。">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-xl border px-3 py-2 text-base"
              placeholder="例如：1959"
              value={spouseBirthYearText}
              onChange={(e) => setSpouseBirthYearText(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            <div className="text-xs text-gray-500 mt-2">
              配偶年龄：{spouseAge > 0 ? `${spouseAge} 岁` : "（可选）"}
            </div>
          </Field>

          <Field label="情景结构" hint="仅一人 1 段，或先后两人 2 段相加。">
            <ChoicePills
              value={scenarioType}
              onChange={setScenarioType}
              options={[
                { label: "仅一人 1 段 LTC", value: "ONE" },
                { label: "先后两人 2 段 LTC 相加", value: "TWO" },
              ]}
            />
            <div className="text-xs text-gray-500 mt-2">
              已选：{scenarioType === "ONE" ? "仅一人 1 段" : "先后两人 2 段相加"}
            </div>
          </Field>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-5 mt-6">
        <Field label="情景起点年龄" hint="默认 85；应 ≥ 当前年龄。">
          <NumberInput value={startAge} onChange={(v) => setStartAge(clamp(v, 40, 110))} min={40} max={110} />
        </Field>

        <Field label="护理持续年限（每段）" hint="默认 5 年。">
          <NumberInput value={durationYears} onChange={(v) => setDurationYears(clamp(v, 1, 20))} min={1} max={20} />
        </Field>

        <Field label="高级选项开关" hint="用于框架先跑通（不引入外部数据）。">
          <div className="text-xs text-gray-500">下方“间隔/通胀”会影响起点成本推演</div>
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-5">
        <Field label="两人发生间隔（年）" hint="仅在“两段”情景下有意义。">
          <NumberInput value={spouseGapYears} onChange={(v) => setSpouseGapYears(clamp(v, 0, 25))} min={0} max={25} />
        </Field>

        <Field label="成本年化增长率（%）" hint="用于把“今天价格”推到“情景起点年龄”。">
          <NumberInput value={costInflationPct} onChange={(v) => setCostInflationPct(clamp(v, 0, 12))} min={0} max={12} />
        </Field>

        <Field label="LTC 年度成本（按今天价格）" hint="工程假设：用于压力测试。">
          {/* ✅ 这里就是你之前 push 后炸掉的地方：现在改成正确 JSX */}
          <NumberInput
            value={annualCostToday}
            onChange={(v) => setAnnualCostToday(clamp(v, 50000, 600000))}
            min={50000}
            max={600000}
            step={1000}
          />
          <div className="text-xs text-gray-500 mt-2">提示：这不是预测；你可以随时回来调整。</div>
        </Field>
      </div>

      <div className="mt-6 rounded-2xl border p-4 bg-gray-50">
        <div className="text-sm font-semibold mb-2">工程假设（自动计算）</div>
        <div className="text-xs text-gray-700 leading-relaxed">
          距离情景起点约 <b>{yearsToStart}</b> 年；按成本年化增长率 <b>{costInflationPct}%</b> 推演，
          情景起点的年度成本约为：<b>{fmtUSD(inflatedAnnualCostAtStart)}</b>
          <br />
          （用于压力测试骨架：起点年度成本 × 年数）
        </div>
      </div>

      <Nav step={step} setStep={setStep} canNext={currentAge > 0} />
    </StepShell>
  );

  const Screen3 = () => (
    <StepShell title="哪些钱，真的能在压力时刻用上？" subtitle="账面资产 ≠ 可动用现金。我们只计算你愿意、也能够动用的部分。">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="当前可动用资产（现金池）" hint="例如：现金、可卖出的资产（你愿意卖）。">
          <NumberInput value={currentPool} onChange={(v) => setCurrentPool(clamp(v, 0, 5e7))} min={0} max={5e7} />
        </Field>

        <Field label="每年可新增储蓄/投入" hint="例如：每年净结余可投入。">
          <NumberInput
            value={annualContribution}
            onChange={(v) => setAnnualContribution(clamp(v, 0, 5e6))}
            min={0}
            max={5e6}
          />
        </Field>

        <Field label="投入年数" hint="例如：10 年。">
          <NumberInput value={contributionYears} onChange={(v) => setContributionYears(clamp(v, 0, 40))} min={0} max={40} />
        </Field>

        <Field label="净回报率（%）" hint="用于把投入折算到未来。">
          <ChoicePills
            value={netReturnChoice}
            onChange={setNetReturnChoice}
            options={[
              { label: "1%", value: "1.0" },
              { label: "3%", value: "3.0" },
              { label: "5%", value: "5.0" },
              { label: "7%", value: "7.0" },
            ]}
          />
          <div className="text-xs text-gray-500 mt-2">已选：{netReturnChoice}%</div>
        </Field>
      </div>

      <div className="mt-6 rounded-2xl border p-4">
        <div className="text-sm font-semibold mb-2">未来可动用资产（估算）</div>
        <div className="text-sm">
          未来价值（FV）≈ <b>{fmtUSD(fv)}</b>
        </div>
        <div className="text-xs text-gray-500 mt-2">说明：这是工程估算，用于对比不同方案，不代表投资建议。</div>
      </div>

      <Nav step={step} setStep={setStep} />
    </StepShell>
  );

  const Screen4 = () => (
    <StepShell title="合同/福利是否覆盖一部分？" subtitle="先用“年度给付 × 年数”的工程方式跑通。后续可引入更真实的条款/概率。">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="是否有 LTC 合同/福利" hint="例如：LTC 保险、年金附加给付等。">
          <Toggle checked={hasContract} onChange={setHasContract} label={hasContract ? "有合同/福利" : "没有合同/福利"} />
        </Field>

        {hasContract ? (
          <div className="grid gap-5">
            <Field label="合同年度可给付" hint="例如：$138,000/年">
              <NumberInput
                value={annualContractBenefit}
                onChange={(v) => setAnnualContractBenefit(clamp(v, 0, 6e5))}
                min={0}
                max={6e5}
              />
            </Field>
            <Field label="给付年数" hint="例如：6 年">
              <NumberInput value={contractBenefitYears} onChange={(v) => setContractBenefitYears(clamp(v, 0, 20))} min={0} max={20} />
            </Field>
          </div>
        ) : null}
      </div>

      <Nav step={step} setStep={setStep} />
    </StepShell>
  );

  const Screen5 = () => (
    <StepShell
      title="你希望留多少“缓冲池”？"
      subtitle="缓冲用于对抗不确定性（护理更久/费用更高/给付延迟等）。前面已推演通胀，因此这里不再重复通胀。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="缓冲比例（%）" hint="缓冲系数 = 缓冲比例。比如 18% 意味着在成本基础上再加 18%。">
          <NumberInput value={techBufferPct} onChange={(v) => setTechBufferPct(clamp(v, 0, 50))} min={0} max={50} />
        </Field>

        <div className="rounded-2xl border p-4 bg-gray-50">
          <div className="text-sm font-semibold mb-2">当前测算摘要</div>
          <div className="text-xs text-gray-700 leading-relaxed">
            情景起点年度成本（推演后）：<b>{fmtUSD(inflatedAnnualCostAtStart)}</b>
            <br />
            总年数（按情景结构）：<b>{totalLtcYears}</b>
            <br />
            总成本（骨架）：<b>{fmtUSD(totalCostAtStart)}</b>
            <br />
            缓冲金额：<b>{fmtUSD(bufferAmount)}</b>
          </div>
        </div>
      </div>

      <Nav step={step} setStep={setStep} />
    </StepShell>
  );

  const Screen6 = () => (
    <StepShell
      title="结果总览（v1）"
      subtitle="这里先输出清晰的数值总览。Plan B / Plan C 目前只是示意开关（尚未绑定不同计算逻辑）。"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold mb-2">情景成本（压力测试骨架）</div>
          <div className="text-sm">总成本：<b>{fmtUSD(totalCostAtStart)}</b></div>
          <div className="text-sm mt-1">缓冲池：<b>{fmtUSD(bufferAmount)}</b></div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold mb-2">可动用资金（工程估算）</div>
          <div className="text-sm">未来可动用资产（FV）：<b>{fmtUSD(fv)}</b></div>
          <div className="text-xs text-gray-500 mt-2">后续会把“每年序列/棒图/合同给付路径”加进来。</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <Field label="Plan B（示意开关）" hint="当前仅用于 UI；后续会绑定不同策略/合同结构。">
          <Toggle checked={planBOn} onChange={setPlanBOn} label={planBOn ? "Plan B 已开启" : "Plan B 未开启"} />
        </Field>
        <Field label="Plan C（示意开关）" hint="当前仅用于 UI；后续会绑定不同策略/合同结构。">
          <Toggle checked={planCOn} onChange={setPlanCOn} label={planCOn ? "Plan C 已开启" : "Plan C 未开启"} />
        </Field>
      </div>

      {/* 最后一页：不再显示“下一步”按钮（避免“无功能下一步”） */}
      <Nav step={step} setStep={setStep} canNext={false} nextLabel="已是最后一步" />
    </StepShell>
  );

  if (step === 1) return <Screen1 />;
  if (step === 2) return <Screen2 />;
  if (step === 3) return <Screen3 />;
  if (step === 4) return <Screen4 />;
  if (step === 5) return <Screen5 />;
  return <Screen6 />;
}
