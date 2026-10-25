# Pump lab model

Contract `kairo-pump-lab-model/1`. Source: [`physics.ts`](../../studio/src/pump-lab/physics.ts), [`instruments.ts`](../../studio/src/pump-lab/instruments.ts). Status string shown in the app: *illustrative teaching model, not validated against a real pump*.

## Units and domain

Flow L/s · head m of water · pressure kPa gauge · power kW · speed rpm · level m · volume L (1 m of level = 3,000 L, tank area 3 m²).

| Input | Permitted | Notes |
|---|---|---|
| Pump speed | integers 600–1,450 rpm | Rated 1,450 rpm (4-pole induction motor on 50 Hz, about 3% slip). Below 600 rpm the model reports no flow. |
| Valve handle | integers 0–100% | 0 is closed: no flow. |
| Run time | integers 1–600 s | One-second steps. |
| Predicted flow | 0–30 L/s | Rounded to 0.1. |
| Seed | integers 0–4,294,967,295 | Drives instrument noise only. |

Anything else (NaN, infinity, strings, out of range, fractional where an integer is required) is rejected with a `PumpLabError` and a stable `code`; the session state is left untouched.

## Equations

With *n* = speed ÷ 1,450 and *Q* in L/s:

- Pump curve (affinity laws): `H_pump = n²·H0·f − c·Q²`, H0 = 22 m, c = 0.06 m/(L/s)², f = impeller head factor (1 when new). Head ∝ n² and flow ∝ n are exact for this form.
- System head the pump must supply: `H_sys = lift + (K_in + K_pipe + K_valve)·Q²`, with lift = 3 m + destination level − source level, K_in = 0.002, K_pipe = 0.02, K_valve = 0.01 ÷ x² (x = effective valve opening as a fraction).
- Operating point: the Q where `H_pump·φ = H_sys`. The residual is strictly decreasing in Q, so a 100-step bisection finds a unique root and is deterministic. With no cavitation it equals the closed form `Q = √((n²H0 − lift) / (c + ΣK))`; a test checks this.
- Suction: head at the pump inlet is source level − K_in·Q². `NPSH_a = 10.093 m + that head`, where 10.093 m = (101.325 − 2.339) kPa ÷ (ρg). `NPSH_r = n²·(2.0 + 0.012·(Q/n)²)`. Margin = NPSH_a − NPSH_r.
- Cavitation: if the margin is negative, head is multiplied by φ = max(0.5, 1 − 0.12·shortfall). The margin and φ are continuous at zero.
- Power: `P_shaft = n³·(1.1 + 0.1064·Q/n)` kW. Hydraulic power is 9.80665·Q·H_pump W. Efficiency is their ratio; a test checks it stays between 0 and 1 over the whole domain.
- Pressures: discharge head = suction head + H_pump; head after the valve = discharge head − K_valve·Q². kPa = head × 9.80665. All three taps are taken at pump-centre height.
- Tanks: each second moves `min(Q, litres above the suction cut-off, free space)` litres from source to destination. The two volumes always sum to 9,000 L. The pump loses suction below 0.15 m of source level.

Fixed constants: standard gravity 9.80665 m/s² and standard atmosphere 101.325 kPa (exact by definition); water density rounded to 1,000 kg/m³; vapour pressure 2.339 kPa near 20 °C (rounded table value, see the manifest for the source and how far it was checked).

## Limits

| Limit | Value |
|---|---|
| Target flow | 12 L/s |
| Discharge pressure | ≤ 200 kPa |
| Motor shaft power | ≤ 2.2 kW |
| Suction margin | ≥ 0.5 m |
| Source level | ≥ 0.15 m |

## Faults

| Case | Parameter | Healthy → fault |
|---|---|---|
| The handle says open | `valveStuckMaxPct` | 100 → 15 (gate cannot rise past 15%) |
| Crackling and low flow | `suctionK` | 0.002 → 0.14 |
| Runs but delivers weakly | `impellerHeadFactor` | 1 → 0.62 |

Each repair restores the healthy value for that case only. Applying a repair that does not match changes nothing and is logged as having had no effect.

## Instruments and what a learner can infer

A reading gives flow, suction, discharge and after-valve pressure, motor power, speed, valve handle, tank levels, and whether the pump is crackling (true only while cavitating). Noise is uniform and bounded: flow ±1.5% plus a 0.1 L/s display step, pressure ±2 kPa plus a 1 kPa step, power ±0.03 kW plus a 0.01 kW step. Noise is a stateless hash of (seed, reading number, channel), so a replay gives identical readings and a different seed gives different readings but the same underlying truth.

"Compare with datasheet" uses only measured values and the published formulas:

| Section | Measured | Expected |
|---|---|---|
| Suction line and strainer | source level − suction gauge head | 0.002·Q² |
| Pump | (discharge − suction) head | n²·22 − 0.06·Q² |
| Discharge valve | (discharge − after-valve) head | 0.01·Q² ÷ x², x from the handle |

The tolerance for each is the sum of the worst-case instrument errors, so a healthy circuit can never be flagged. Below 4 L/s measured flow the sections are reported as *cannot be judged*, because the fault effects are then within error.

Signature of each cause on an informative reading: stuck gate, valve loss high and the others normal; blocked strainer, suction loss high and valve normal, pump low only if cavitating; worn impeller, pump low and the others normal. The tests sweep speeds 800–1,450, valve 30–100%, and 150 seeds, and require these signatures to hold without exception.

## Known simplifications

Steady state at each instant (no pipe inertia, no start-up transient); incompressible water at one temperature; velocity head ignored; quadratic curves instead of a measured pump curve; one operating condition for NPSH; instant fault repair; no air entrainment, vibration, bearing or seal behaviour; no electrical model of the motor beyond rated speed and shaft power. The motor is a procedural stand-in; the Engineering studio's motor GLB is not imported (it has no published pump-facing interface, and its files are separately owned).

## Validation status

Internal consistency checks pass (see [verification.md](verification.md)). The model has **not** been compared with a real pump and **has not** had an external specialist review. Broad educational release needs that review first.
