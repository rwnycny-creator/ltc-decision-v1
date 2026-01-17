import React, { useMemo, useState } from "react";

const currency = (n) => {
  if (!isFinite(n)) return "$0";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function computeFutureValue({ currentAge, startAge, currentPool, annualContribution, contributionYears, netReturn }) {
  const yearsToStart = Math.max(0, Math.round(startAge - currentAge));
  let pool = Math.max(0, currentPool);
  for (let y = 1; y <= yearsToStart; y++) {
    if (y <= contributionYears) pool += Math.max(0, annualContribution);
    pool *= 1 + netReturn;
  }
  return { poolAtStart: pool, yearsToStart };
}

function simulateCare({ poolAtStart, annualCost, durationYears, annualContractBenefit, contractBenefitYears }) {
  let pool = poolAtStart;
  let forcedSellYear = null;
  const rows = [];

  for (let year = 1; year <= durationYears; year++) {
    const contractOffset = year <= contractBenefitYears ? Math.min(annualCost, annualContractBenefit) : 0;
    const netOutflow = Math.max(0, annualCost - contractOffset);

    const startBal = pool;
    pool = pool - netOutflow;
    const endBal = pool;

    if (forcedSellYear == null && endBal < 0) forcedSellYear = year;

    rows.push({ year, annualCost, contractOffset, netOutflow, startBal, endBal });
  }

  const yearsOfCoverage = forcedSellYear == null ? durationYears : Math.max(0, forcedSellYear - 1);
  return { rows, forcedSellYear, yearsOfCoverage, endingBalance: pool };
}

const StepShell = ({ title, subtitle, children }) => (
  <div className="max-w-3xl mx-auto p-4 md:p-8">
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm md:text-base text-gray-600 mt-2">{subtitle}</p> : null}
    </div>
    <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-6">{children}</div>
  </div>
);

const Pill = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm border transition ${
      active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div>
      <div className="text-sm font-medium">{label}</div>
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </div>
    {children}
  </div>
);

const NumberInput = ({ value, onChange, min, max, step = 1 }) => (
  <input
    type="number"
    className="w-full rounded-xl border px-3 py-2 text-sm"
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
  />
);

const Slider = ({ value, onChange, min = 0, max = 100, step = 1 }) => (
  <input type="range" className="w-full" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
);

export default function App() {
  const [step, setStep] = useState(1);

  const choices = [
    "在市场低点被迫卖资产",
    "被迫卖掉房子或核心资产",
    "被迫进入不想去的护理机构",
    "完全依赖子女或他人决策",
    "被单一合同或产品锁死选择",
    "现金流突然断裂，来不及调整",
  ];
  const [valueAnchor, setValueAnchor] = useState([]);

  // V1.0.1: birth year -> auto age
const nowYear = new Date().getFullYear();
const [birthYear, setBirthYear] = useState(1957);

// Approx age: does not account for birthday month/day (good enough for V1)
const currentAge = useMemo(() => {
  const y = Number(birthYear);
  if (!y || y < 1900 || y > nowYear) return 0;
  return nowYear - y;
}, [birthYear, nowYear]);
  const [startAge, setStartAge] = useState(85);
  const [annualCost, setAnnualCost] = useState(300000);
  const [durationYears, setDurationYears] = useState(5);

  const [currentPool, setCurrentPool] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(100000);
  const [contributionYears, setContributionYears] = useState(10);
  const [netReturnChoice, setNetReturnChoice] = useState("3.0");

  const [hasContract, setHasContract] = useState(false);
  const [annualContractBenefit, setAnnualContractBenefit] = useState(138000);
  const [contractBenefitYears, setContractBenefitYears] = useState(6);

  const [techBufferPct, setTechBufferPct] = useState(18);

  const [planBOn, setPlanBOn] = useState(false);
  const [planCOn, setPlanCOn] = useState(true);

  const netReturn = useMemo(() => clamp(Number(netReturnChoice) / 100, 0, 0.08), [netReturnChoice]);

  const fv = useMemo(
    () =>
      computeFutureValue({
        currentAge,
        startAge,
        currentPool,
        annualContribution,
        contributionYears,
        netReturn,
      }),
    [currentAge, startAge, currentPool, annualContribution, contributionYears, netReturn]
  );

  const scenarioDefs = useMemo(() => {
    const base = { key: "A", name: "情景 A：基准最坏", annualCost, durationYears, note: "不使用任何技术降本假设。" };

    const bReduction = planCOn ? clamp(techBufferPct / 100, 0.1, 0.3) : 0;
    const b = {
      key: "B",
      name: "情景 B：技术改善",
      annualCost: Math.round(annualCost * (1 - bReduction)),
      durationYears,
      note: planCOn ? `成本按技术改善下修约 ${(bReduction * 100).toFixed(0)}%。` : "未启用技术缓冲。",
    };

    const c = {
      key: "C",
      name: "情景 C：短期高强度",
      annualCost: Math.round(annualCost * 1.25),
      durationYears: Math.max(2, Math.round(durationYears * 0.6)),
      note: "更短、更尖峰的现金流冲击（示意）。",
    };

    return [base, b, c];
  }, [annualCost, durationYears, planCOn, techBufferPct]);

  const [scenarioKey, setScenarioKey] = useState("A");
  const activeScenario = scenarioDefs.find((s) => s.key === scenarioKey) || scenarioDefs[0];

  const sim = useMemo(() => {
    const useContract = hasContract && planBOn;
    return simulateCare({
      poolAtStart: fv.poolAtStart,
      annualCost: activeScenario.annualCost,
      durationYears: activeScenario.durationYears,
      annualContractBenefit: useContract ? annualContractBenefit : 0,
      contractBenefitYears: useContract ? contractBenefitYears : 0,
    });
  }, [fv.poolAtStart, activeScenario, hasContract, planBOn, annualContractBenefit, contractBenefitYears]);

  const canNext = useMemo(() => {
    if (step === 1) return valueAnchor.length >= 1 && valueAnchor.length <= 3;
    if (step === 2) return currentAge > 0 && startAge >= currentAge && durationYears >= 1 && annualCost > 0;
    if (step === 3) return currentPool >= 0 && annualContribution >= 0 && contributionYears >= 0;
    return true;
  }, [step, valueAnchor.length, startAge, currentAge, durationYears, annualCost, currentPool, annualContribution, contributionYears]);

  const Nav = () => (
    <div className="flex items-center justify-between mt-6">
      <button
        className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-40"
        disabled={step === 1}
        onClick={() => setStep((s) => Math.max(1, s - 1))}
      >
        返回
      </button>
      <button
        className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-40"
        disabled={!canNext || step === 6}
        onClick={() => setStep((s) => Math.min(6, s + 1))}
      >
        {step === 3 ? "查看情景结果" : step === 5 ? "生成我的蓝图" : "下一步"}
      </button>
    </div>
  );

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
              className={`text-left rounded-2xl border p-4 hover:bg-gray-50 transition ${active ? "border-black bg-gray-50" : ""}`}
              onClick={() => {
                setValueAnchor((prev) => {
                  if (prev.includes(c)) return prev.filter((x) => x !== c);
                  if (prev.length >= 3) return prev;
                  return [...prev, c];
                });
              }}
            >
              <div className="text-sm font-medium">{c}</div>
              <div className="text-xs text-gray-500 mt-1">{active ? "已选择" : "点击选择"}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500">已选：{valueAnchor.length} / 3</div>
      <Nav />
    </StepShell>
  );

  const Screen2 = () => (
    <StepShell title="建立你的压力测试基准" subtitle="我们不预测概率，只测试后果。请设定一个你希望一定能扛住的情景。">
      <div className="grid md:grid-cols-3 gap-5">
        <Field label="出生年份（YYYY）" hint="用于自动计算当前年龄（V1.0.1）。">
  <NumberInput
    value={birthYear}
    onChange={(v) => setBirthYear(clamp(v, 1900, nowYear))}
    min={1900}
    max={nowYear}
    step={1}
  />
  <div className="text-xs text-gray-500 mt-2">
    自动计算当前年龄：{currentAge > 0 ? `${currentAge} 岁` : "（请输入正确出生年份）"}
  </div>
</Field>
        <Field label="情景起点年龄" hint="默认 85；应 ≥ 当前年龄。">
          <NumberInput value={startAge} onChange={(v) => setStartAge(clamp(v, 40, 110))} min={40} max={110} />
        </Field>
        <Field label="护理持续年限" hint="默认 5 年。">
          <NumberInput value={durationYears} onChange={(v) => setDurationYears(clamp(v, 1, 20))} min={1} max={20} />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="年度 LTC 成本（每人）" hint="工程假设：用于压力测试。">
          <NumberInput value={annualCost} onChange={(v) => setAnnualCost(clamp(v, 50000, 600000))} min={50000} max={600000} step={1000} />
          <div className="text-xs text-gray-500 mt-2">提示：这不是预测；你可以随时回来调整。</div>
        </Field>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen3 = () => (
    <StepShell title="哪些钱，真的能在压力时刻用上？" subtitle="账面资产 ≠ 可动用现金。我们只计算你愿意、也能够动用的部分。">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="当前可动用 LTC 现金池" hint="你愿意用于 LTC 的现金/短债/可迅速变现资产。">
          <NumberInput value={currentPool} onChange={(v) => setCurrentPool(clamp(v, 0, 10000000))} min={0} step={1000} />
          <div className="text-xs text-gray-500 mt-2">当前输入：{currency(currentPool)}</div>
        </Field>

        <div className="space-y-5">
          <Field label="计划每年投入金额" hint="例如每年投入 $100k。">
            <NumberInput value={annualContribution} onChange={(v) => setAnnualContribution(clamp(v, 0, 1000000))} min={0} step={1000} />
          </Field>
          <Field label="计划投入年限" hint="例如 10 年。">
            <NumberInput value={contributionYears} onChange={(v) => setContributionYears(clamp(v, 0, 40))} min={0} max={40} />
          </Field>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-5">
        <Field label="税后年化假设" hint="V1 只提供三档，避免过度精细。">
          <div className="flex flex-wrap gap-2">
            {["2.5", "3.0", "3.5"].map((x) => (
              <Pill key={x} active={netReturnChoice === x} onClick={() => setNetReturnChoice(x)}>
                {x}%
              </Pill>
            ))}
          </div>
        </Field>

        <div className="rounded-2xl border p-4 bg-gray-50">
          <div className="text-sm font-medium">现金池到情景起点（估算）</div>
          <div className="text-2xl font-semibold mt-2">{currency(fv.poolAtStart)}</div>
          <div className="text-xs text-gray-500 mt-1">距离起点约 {fv.yearsToStart} 年；按税后 {netReturnChoice}% 假设滚动。</div>
        </div>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen4 = () => (
    <StepShell title="在压力下，你的结构会在哪里断裂？" subtitle="主视角：Forced-Sell Timeline（现金耗尽/被迫卖资产的时间点）。辅视角：可覆盖年数。">
      <div className="flex flex-wrap gap-2 mb-4">
        {scenarioDefs.map((s) => (
          <Pill key={s.key} active={scenarioKey === s.key} onClick={() => setScenarioKey(s.key)}>
            {s.key}
          </Pill>
        ))}
      </div>

      <div className="rounded-2xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{activeScenario.name}</div>
            <div className="text-xs text-gray-500 mt-1">{activeScenario.note}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">年度成本</div>
            <div className="text-sm font-semibold">{currency(activeScenario.annualCost)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">起点现金池</div>
            <div className="text-lg font-semibold mt-1">{currency(fv.poolAtStart)}</div>
          </div>
          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">可覆盖年数（辅）</div>
            <div className="text-lg font-semibold mt-1">{sim.yearsOfCoverage} 年</div>
          </div>
          <div className="rounded-2xl border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">被迫卖资产的触发点</div>
            <div className="text-lg font-semibold mt-1">{sim.forcedSellYear == null ? "未触发" : `护理第 ${sim.forcedSellYear} 年`}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-medium">Forced-Sell Timeline（逐年）</div>
          <div className="overflow-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="py-2 text-left">年</th>
                  <th className="py-2 text-right">成本</th>
                  <th className="py-2 text-right">合同抵扣</th>
                  <th className="py-2 text-right">净流出</th>
                  <th className="py-2 text-right">期末余额</th>
                </tr>
              </thead>
              <tbody>
                {sim.rows.map((r) => {
                  const depleted = r.endBal < 0;
                  return (
                    <tr key={r.year} className={`border-b ${depleted ? "bg-gray-50" : ""}`}>
                      <td className="py-2">第 {r.year} 年</td>
                      <td className="py-2 text-right">{currency(r.annualCost)}</td>
                      <td className="py-2 text-right">{currency(r.contractOffset)}</td>
                      <td className="py-2 text-right">{currency(r.netOutflow)}</td>
                      <td className={`py-2 text-right font-medium ${depleted ? "text-red-600" : ""}`}>{currency(r.endBal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            说明：合同工具在 V1 中仅作为“年度上限 × 年限”的抵扣模拟（不含报销摩擦/资格条件）。
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button className="px-4 py-2 rounded-xl border hover:bg-gray-50" onClick={() => setStep(5)}>
            调整结构（Plan A/B/C）
          </button>
          <div className="text-xs text-gray-500">你的价值锚点：{valueAnchor.length ? valueAnchor.join("、") : "未选择"}</div>
        </div>
      </div>

      <div className="mt-6">
        <Nav />
      </div>
    </StepShell>
  );

  const Screen5 = () => (
    <StepShell title="如何分工，而不是押注？" subtitle="不是所有风险，都该用同一种工具解决。V1 用开关+参数模拟 Plan B（合同）与 Plan C（技术）。">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Plan B：合同兜底（可选）</div>
              <div className="text-xs text-gray-500 mt-1">启用后，会在护理期按年度上限抵扣（简化）。</div>
            </div>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border ${planBOn ? "bg-black text-white border-black" : ""}`}
              onClick={() => setPlanBOn((v) => !v)}
            >
              {planBOn ? "已启用" : "未启用"}
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={hasContract} onChange={(e) => setHasContract(e.target.checked)} />
              <span className="text-sm">我确实已有某种合同型兜底工具</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">V1 只问“有没有”，不问公司名与条款细节。</div>
          </div>

          <div className={`mt-4 space-y-4 ${hasContract ? "" : "opacity-40 pointer-events-none"}`}>
            <Field label="年度可抵扣上限（示意）" hint="例如 $138k/年。">
              <NumberInput value={annualContractBenefit} onChange={(v) => setAnnualContractBenefit(clamp(v, 0, 400000))} step={1000} />
            </Field>
            <Field label="可抵扣年限（示意）" hint="例如 6 年。">
              <NumberInput value={contractBenefitYears} onChange={(v) => setContractBenefitYears(clamp(v, 0, 20))} min={0} max={20} />
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Plan C：技术 / 自动化缓冲</div>
              <div className="text-xs text-gray-500 mt-1">用于情景 B 的成本下修（V1 简化）。</div>
            </div>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border ${planCOn ? "bg-black text-white border-black" : ""}`}
              onClick={() => setPlanCOn((v) => !v)}
            >
              {planCOn ? "已启用" : "未启用"}
            </button>
          </div>

          <div className={`mt-4 ${planCOn ? "" : "opacity-40 pointer-events-none"}`}>
            <Field label="技术改善幅度（用于情景 B）" hint="建议 15–20%（V1 限定在 10–30%）。">
              <div className="flex items-center gap-3">
                <Slider value={techBufferPct} onChange={(v) => setTechBufferPct(clamp(v, 10, 30))} min={10} max={30} step={1} />
                <div className="w-14 text-right text-sm font-medium">{techBufferPct}%</div>
              </div>
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">即时效果（情景 B 年成本）</div>
            <div className="text-lg font-semibold mt-1">{currency(Math.round(annualCost * (1 - (planCOn ? techBufferPct / 100 : 0))))}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border p-4 bg-gray-50">
        <div className="text-sm font-medium">提示（V1 口径）</div>
        <ul className="text-sm text-gray-600 list-disc pl-5 mt-2 space-y-1">
          <li>Plan A（自我理财）是主力：提供最大流动性与全球可用性。</li>
          <li>Plan B（合同）仅作为缓冲：场景依赖、且存在资格/报销摩擦（V1 未建模）。</li>
          <li>Plan C（技术）是后置选项：允许改善结果，但不作为最低保障前提。</li>
        </ul>
      </div>

      <Nav />
    </StepShell>
  );

  const Screen6 = () => (
    <StepShell title="这是你当前版本的 LTC 决策蓝图" subtitle="V1 原型先做可读摘要；PDF 导出可在 V1.1 增加。">
      <div className="space-y-5">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium">你的选择权底线</div>
          <div className="text-sm text-gray-600 mt-2">{valueAnchor.length ? valueAnchor.join("、") : "（未选择）"}</div>
        </div>

        <div className="rounded-2xl border p-4 bg-gray-50">
          <div className="text-sm font-medium">免责声明</div>
          <div className="text-sm text-gray-600 mt-2">
            本原型用于决策结构与现金流压力测试的理解，不构成医疗、税务、投资或保险建议。
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-xl border hover:bg-gray-50" onClick={() => setStep(4)}>
            返回结果
          </button>
          <button className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90" onClick={() => setStep(1)}>
            从头复跑
          </button>
        </div>
      </div>
    </StepShell>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 1 && <Screen1 />}
      {step === 2 && <Screen2 />}
      {step === 3 && <Screen3 />}
      {step === 4 && <Screen4 />}
      {step === 5 && <Screen5 />}
      {step === 6 && <Screen6 />}
    </div>
  );
}
