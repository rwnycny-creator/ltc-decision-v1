/* === src/App.jsx (fixed) === */
import React, { useMemo, useState, useEffect } from "react";

/**
 * 简单 clamp
 */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * 统一输入组件：允许用户“连续输入”，只在 blur 时把文本 -> 数字并 clamp
 * 解决：金额/年份等输入时被立刻 clamp 导致无法输入完整数字的问题
 */
const NumberInput = ({
  value,
  onChange,
  min = 0,
  max = 999999999,
  step,
  placeholder = "",
  className = "",
}) => {
  const [text, setText] = React.useState(value ?? "");

  // 外部 value 变化时，同步回输入框显示（例如从别处 reset）
  React.useEffect(() => {
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
        // 只允许数字；允许用户处于“正在输入中”的状态（空、部分数字）
        const next = e.target.value.replace(/\D/g, "");
        setText(next);
      }}
      onBlur={() => {
        // 离开输入框时，把 text -> 数字并 clamp
        if (String(text).trim() === "") {
          // 这里选择：空值不更新（保持原 value），也可以改成 onChange?.(0)
          return;
        }
        const n = Number(text);
        if (!Number.isFinite(n)) return;
        const clamped = clamp(n, min, max);
        onChange?.(clamped);
        setText(String(clamped)); // 回写为规范化后的值
      }}
    />
  );
};

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

const StepShell = ({ title, subtitle, children }) => (
  <div className="max-w-3xl mx-auto p-4 md:p-8">
    <div className="mb-6">
      {/* 标题字号稍微小一些（更接近“原来的一半观感”） */}
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{subtitle}</p>
    </div>
    <div className="bg-white rounded-3xl shadow p-6">{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </div>
    {children}
  </div>
);

export default function App() {
  const [step, setStep] = useState(1);

  // Screen 1
  const choices = [
    "在市场低点被迫卖资产",
    "被迫卖掉房子或核心资产",
    "被迫进入不想去的护理机构",
    "完全依赖子女或他人决策",
    "被单一合同或产品锁死选择",
    "现金流突然断裂，来不及调整",
  ];
  const [valueAnchor, setValueAnchor] = useState([]);

  // Screen 2: birth year -> auto age
  const nowYear = new Date().getFullYear();
  const [birthYearText, setBirthYearText] = useState("");

  const birthYearNum = useMemo(() => Number(birthYearText), [birthYearText]);

  const currentAge = useMemo(() => {
    if (birthYearNum >= 1900 && birthYearNum <= nowYear) return nowYear - birthYearNum;
    return 0;
  }, [birthYearNum, nowYear]);

  const [startAge, setStartAge] = useState(85);

  // 若输入了出生年，确保“情景起点年龄”不小于当前年龄
  useEffect(() => {
    if (currentAge > 0 && startAge < currentAge) {
      setStartAge(currentAge);
    }
  }, [currentAge, startAge]);

  const [durationYears, setDurationYears] = useState(5);
  const [annualCost, setAnnualCost] = useState(300000);

  // Screen 3
  const [currentPool, setCurrentPool] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [contributionYears, setContributionYears] = useState(10);
  const [netReturnChoice, setNetReturnChoice] = useState("3.0");

  // Contract
  const [hasContract, setHasContract] = useState(false);
  const [annualContractBenefit, setAnnualContractBenefit] = useState(138000);
  const [contractBenefitYears, setContractBenefitYears] = useState(6);

  const [techBufferPct, setTechBufferPct] = useState(18);

  // Strategy toggles
  const [planBOn, setPlanBOn] = useState(false);
  const [planCOn, setPlanCOn] = useState(true);

  // computed
  const netReturn = useMemo(() => clamp(Number(netReturnChoice) / 100, 0, 0.08), [netReturnChoice]);

  // ==== Simple FV calc (toy) ====
  const computeFutureValue = ({ pv = 0, pmt = 0, years = 0, r = 0 }) => {
    // FV = pv*(1+r)^n + pmt*(((1+r)^n -1)/r)
    const n = years;
    const growth = Math.pow(1 + r, n);
    if (r === 0) return pv + pmt * n;
    return pv * growth + pmt * ((growth - 1) / r);
  };

  const fv = useMemo(() => {
    return computeFutureValue({
      pv: currentPool,
      pmt: annualContribution,
      years: contributionYears,
      r: netReturn,
    });
  }, [currentPool, annualContribution, contributionYears, netReturn]);

  const stressCostTotal = useMemo(() => {
    // two people cost in scenario years
    const people = 2;
    return annualCost * people * durationYears;
  }, [annualCost, durationYears]);

  const contractOffsetTotal = useMemo(() => {
    if (!hasContract) return 0;
    return annualContractBenefit * contractBenefitYears;
  }, [hasContract, annualContractBenefit, contractBenefitYears]);

  const bufferMultiplier = useMemo(() => 1 + techBufferPct / 100, [techBufferPct]);

  const requiredPool = useMemo(() => {
    // rough: scenario cost - contract offsets, with buffer
    const base = Math.max(0, stressCostTotal - contractOffsetTotal);
    return base * bufferMultiplier;
  }, [stressCostTotal, contractOffsetTotal, bufferMultiplier]);

  const gap = useMemo(() => Math.max(0, requiredPool - fv), [requiredPool, fv]);

  // ==== Navigation ====
  const Nav = () => (
    <div className="flex items-center justify-between mt-8">
      <button
        className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
        onClick={() => setStep((s) => Math.max(1, s - 1))}
        disabled={step === 1}
      >
        上一步
      </button>
      <div className="text-xs text-gray-500">
        Step {step} / 6
      </div>
      <button
        className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-40"
        onClick={() => setStep((s) => Math.min(6, s + 1))}
        disabled={step === 6}
      >
        下一步
      </button>
    </div>
  );

  // ===================== SCREENS =====================

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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{c}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {active ? "已选择（再点可取消）" : "点击选择"}
                  </div>
                </div>
                <div className="text-sm">{active ? "✓" : ""}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500">已选：{valueAnchor.length} / 3</div>
      <Nav />
    </StepShell>
  );

  const Screen2 = () => (
    <StepShell
      title="建立你的压力测试基准"
      subtitle="我们不预测概率，只测试后果。请设定一个你希望一定能扛住的情景。"
    >
      <div className="grid md:grid-cols-3 gap-5">
        <Field label="出生年份（YYYY）" hint="用于自动计算当前年龄（V1.0.1）。">
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-xl border px-3 py-2 text-base"
            placeholder="例如：1957"
            value={birthYearText}
            onChange={(e) => {
              // 只允许数字，且最多 4 位
              const next = e.target.value.replace(/\D/g, "").slice(0, 4);
              setBirthYearText(next);
            }}
            onBlur={() => {
              // 离开输入框时再做“规范化”：合法就保留；不合法就清空
              const n = Number(birthYearText);
              if (Number.isFinite(n) && n >= 1900 && n <= nowYear) {
                setBirthYearText(String(n));
              } else {
                setBirthYearText("");
              }
            }}
          />
          <div className="text-xs text-gray-500 mt-2">
            自动计算当前年龄：{currentAge > 0 ? `${currentAge} 岁` : "（请输入正确出生年份）"}
          </div>
        </Field>

        <Field label="情景起点年龄" hint="默认 85；应 ≥ 当前年龄（系统会自动帮你调到不小于当前年龄）。">
          <NumberInput
            value={startAge}
            onChange={(v) => v !== undefined && setStartAge(v)}
            min={40}
            max={110}
          />
        </Field>

        <Field label="护理持续年限" hint="默认 5 年。">
          <NumberInput
            value={durationYears}
            onChange={(v) => v !== undefined && setDurationYears(v)}
            min={1}
            max={20}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="年度 LTC 成本（每人）" hint="工程假设：用于压力测试。">
          <NumberInput
            value={annualCost}
            onChange={(v) => v !== undefined && setAnnualCost(v)}
            min={50000}
            max={600000}
            step={1000}
          />
          <div className="text-xs text-gray-500 mt-2">提示：这不是预测；你可以随时回来调整。</div>
        </Field>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen3 = () => (
    <StepShell title="哪些钱，真的能在压力时刻用上？" subtitle="账面资产 ≠ 可动用现金。我们只计算你愿意、也能够动用的部分。">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="可动用资金池（现有）" hint="你愿意用于 LTC 的现有可动用资产。">
          <NumberInput
            value={currentPool}
            onChange={(v) => v !== undefined && setCurrentPool(clamp(v, 0, 10000000))}
            min={0}
            step={1000}
          />
        </Field>

        <Field label="每年追加（可动用）" hint="例如每年存入/转入用于 LTC 的金额。">
          <NumberInput
            value={annualContribution}
            onChange={(v) => v !== undefined && setAnnualContribution(clamp(v, 0, 1000000))}
            min={0}
            step={1000}
          />
        </Field>

        <Field label="追加年限" hint="例如 10 年。">
          <NumberInput
            value={contributionYears}
            onChange={(v) => v !== undefined && setContributionYears(clamp(v, 0, 40))}
            min={0}
            max={40}
            step={1}
          />
        </Field>

        <Field label="净回报假设（年化）" hint="工程假设：0%–8%。">
          <div className="flex items-center gap-3">
            <select
              className="rounded-xl border px-3 py-2 text-base"
              value={netReturnChoice}
              onChange={(e) => setNetReturnChoice(e.target.value)}
            >
              <option value="0.0">0.0%</option>
              <option value="1.0">1.0%</option>
              <option value="2.0">2.0%</option>
              <option value="3.0">3.0%</option>
              <option value="4.0">4.0%</option>
              <option value="5.0">5.0%</option>
              <option value="6.0">6.0%</option>
              <option value="7.0">7.0%</option>
              <option value="8.0">8.0%</option>
            </select>
            <div className="text-xs text-gray-500">仅用于压力测试。</div>
          </div>
        </Field>
      </div>

      <div className="mt-6 rounded-2xl bg-gray-50 p-4">
        <div className="text-sm font-medium">预计可动用资金（粗略）</div>
        <div className="text-2xl font-semibold mt-1">${Math.round(fv).toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-1">
          计算：现有资金池 + 每年追加 × 年限 ×（净回报）
        </div>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen4 = () => (
    <StepShell title="合同/福利能抵多少？" subtitle="如果你有 LTC 相关合同或福利（例如某些合同给付、报销上限等），这里做一个“示意扣减”。">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={hasContract} onChange={(e) => setHasContract(e.target.checked)} />
          <div className="text-sm">我有可用于 LTC 的合同/福利（示意）</div>
        </div>

        {hasContract && (
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="年度可抵扣上限（示意）" hint="例如 $138k/年。">
              <NumberInput
                value={annualContractBenefit}
                onChange={(v) => v !== undefined && setAnnualContractBenefit(clamp(v, 0, 400000))}
                step={1000}
              />
            </Field>

            <Field label="福利年限（示意）" hint="例如 6 年。">
              <NumberInput
                value={contractBenefitYears}
                onChange={(v) => v !== undefined && setContractBenefitYears(clamp(v, 0, 20))}
                min={0}
                max={20}
                step={1}
              />
            </Field>
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="text-sm font-medium">合同/福利预计抵扣（示意）</div>
          <div className="text-2xl font-semibold mt-1">${Math.round(contractOffsetTotal).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">注：仅作为模型扣减项示意。</div>
        </div>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen5 = () => (
    <StepShell title="技术缓冲（预留）" subtitle="现实会更复杂：通胀、护理升级、家庭决策摩擦等。这里用一个缓冲系数粗略覆盖。">
      <div className="space-y-5">
        <Field label="缓冲比例" hint="默认 18%。">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Slider value={techBufferPct} onChange={setTechBufferPct} min={0} max={40} step={1} />
            </div>
            <div className="text-sm font-medium">{techBufferPct}%</div>
          </div>
        </Field>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="text-sm font-medium">缓冲倍数</div>
          <div className="text-2xl font-semibold mt-1">{bufferMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen6 = () => (
    <StepShell title="结果摘要：你是否能扛住？" subtitle="这是一份“压力测试摘要”，不是预测。你可以回到前面任何一页调整参数。">
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">情景总成本（2人）</div>
            <div className="text-xl font-semibold mt-1">${Math.round(stressCostTotal).toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">合同/福利抵扣（示意）</div>
            <div className="text-xl font-semibold mt-1">${Math.round(contractOffsetTotal).toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">含缓冲后的需求池</div>
            <div className="text-xl font-semibold mt-1">${Math.round(requiredPool).toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm font-medium">可动用资金（估算）</div>
          <div className="text-2xl font-semibold mt-1">${Math.round(fv).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">
            若你把“可动用资金池/每年追加/年限/净回报”视作可调整的工具，这里会是最敏感的杠杆。
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${gap > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          <div className="text-sm font-medium">{gap > 0 ? "缺口（需要 Plan B/C）" : "覆盖（压力下仍可选择）"}</div>
          <div className="text-2xl font-semibold mt-1">${Math.round(gap).toLocaleString()}</div>
          {gap > 0 ? (
            <div className="text-xs text-red-700 mt-2">提示：你可以通过提高可动用资金、降低成本假设、增加合同抵扣或提高缓冲策略来缩小缺口。</div>
          ) : (
            <div className="text-xs text-green-700 mt-2">提示：你仍可回到前面微调，寻找更稳健的组合。</div>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="text-sm font-medium">你在 Screen 1 选择的“最怕失去”</div>
          <div className="text-xs text-gray-600 mt-2">
            {valueAnchor.length ? valueAnchor.map((x) => `• ${x}`).join("\n") : "（未选择）"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" checked={planBOn} onChange={(e) => setPlanBOn(e.target.checked)} />
          <div className="text-sm">Plan B（示意开关）</div>
          <input type="checkbox" checked={planCOn} onChange={(e) => setPlanCOn(e.target.checked)} className="ml-6" />
          <div className="text-sm">Plan C（示意开关）</div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setStep(1)}>
            回到第 1 步重新测试
          </button>
        </div>
      </div>
    </StepShell>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/*
        重要：不要用 <ScreenX /> 这种“组件类型”，因为 ScreenX 函数是在 App() 内部定义的，
        每次渲染都会生成新的函数引用，React 会把它当成“新组件”并卸载/重挂载，
        从而导致输入框每输入一个字符就丢焦点（你遇到的“要挪鼠标才能继续输入”就是这个）。
      */}
      {step === 1 && Screen1()}
      {step === 2 && Screen2()}
      {step === 3 && Screen3()}
      {step === 4 && Screen4()}
      {step === 5 && Screen5()}
      {step === 6 && Screen6()}
    </div>
  );
}
