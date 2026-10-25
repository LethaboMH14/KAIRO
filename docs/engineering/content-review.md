# Engineering Studio content review (ENG-001, ENG-002A)

Reviewed 21 October 2026 by `claude-engineering-20261021-a` (Claude Code, claude-opus-5-5, effort max). The supply experiments and fault question (ENG-002A, backlog 6.02) were added and reviewed on 22 October 2026 by `claude-engineering-20261022-a` (Claude Code, claude-opus-5-5, effort max); see [Supply experiments](#supply-experiments-eng-002a). Every learner-facing claim in `studio/src/engineering/motorContent.ts` and the studio copy is listed below with its basis. Quotes are short extracts from the page named; everything else is paraphrased. A reviewer should re-open the links rather than trust this table.

Basis codes:
- **S** is an external source, linked below.
- **M** is a property of this 3D model, checkable in `motorGeometry.json` or `build_motor.py`.
- **C** is calculated by code and tested in `docs/engineering/checks/`.
- **D** is a design statement about what the studio shows.

## Sources

1. Wikipedia, Induction motor: <https://en.wikipedia.org/wiki/Induction_motor>
2. Wikipedia, Squirrel-cage rotor: <https://en.wikipedia.org/wiki/Squirrel-cage_rotor>
3. Engineering ToolBox, Induction motors: synchronous vs full-load speed: <https://www.engineeringtoolbox.com/synchronous-full-load-speed-induction-motors-d_1448.html>
4. Wikipedia, Eddy current: <https://en.wikipedia.org/wiki/Eddy_current>
5. Wikipedia, TEFC: <https://en.wikipedia.org/wiki/TEFC>
6. Electrical Volt, 3-phase motor star and delta connection: <https://electricalvolt.com/3-phase-motor-star-and-delta-connection>
7. US 8,007,241 B2, Bi-directional cooling fan: <https://patents.google.com/patent/US8007241>
8. Wikipedia, Rotating magnetic field: <https://en.wikipedia.org/wiki/Rotating_magnetic_field>
9. Wikipedia, Magnetic core: <https://en.wikipedia.org/wiki/Magnetic_core>
10. Wikipedia, Ball bearing: <https://en.wikipedia.org/wiki/Ball_bearing>
11. US 10,436,204 B2, Fan assembly for cooling electric machine: <https://patents.google.com/patent/US10436204>
12. Wikipedia, AC motor: <https://en.wikipedia.org/wiki/AC_motor>
13. Wikipedia, Three-phase electric power: <https://en.wikipedia.org/wiki/Three-phase_electric_power>
14. W. H. Kersting, "Causes and effects of single-phasing induction motors", *IEEE Transactions on Industry Applications* 41(6), pp. 1499–1505, 2005: <https://doi.org/10.1109/TIA.2005.857467>. Only the abstract was read, on IEEE Xplore (document 1542302); the full paper is paywalled.
15. Eaton Bussmann series, *Selecting Protective Devices* (SPD) handbook, 2017, section 7.14.10 "Voltage unbalance and single-phasing", p. 7-134: <http://www.cooperindustries.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-br-3002-spd-2017.pdf>. This is Eaton's own file on the Cooper Industries host. Eaton's single-phasing note on eaton.com timed out from this machine and was not read.

Sources 1, 12 and 13 were read as raw wikitext on 22 October 2026, so the quotes below match the live articles on that date.

## Claims

| Where | Claim (paraphrased) | Basis | Evidence |
|---|---|---|---|
| Overview | Squirrel-cage motors are widely used to drive industrial machines because they are self-starting, reliable and economical. | S1 | Lead: "widely used as industrial drives because they are self-starting, reliable, and economical" |
| Overview, spec | 4 poles, 36 stator slots, 28 rotor bars skewed 10°, 0.8 mm air gap | M | `machine` block in motorGeometry.json. The air gap is the bore radius (58.0 mm) minus the rotor radius (57.2 mm). |
| Housing | The frame grips the stator core, carries the end shields and stands on two drilled feet. | M | `build_housing` and `build_end_shield` geometry |
| Housing | Fins add surface area. Air from the shaft fan flows along them and removes heat from losses in the windings and steel. | S1, S5 | S1: "interior heat losses are dissipated indirectly through enclosure fins". S5: an external fan "blows outside air over the frame". S1's efficiency section lists "Stator losses" and "Iron or core losses" among the full-load losses. |
| Housing | TEFC means totally enclosed, fan-cooled, and outside air is kept from circulating inside. | S5 | The enclosure "does not permit outside air to freely circulate". Wording was softened from "never flows" to match. |
| Terminal box | There are six studs, the start and end of each phase. Links join the windings in star or delta to suit the supply voltage. | S6 | "Three-phase motors have six terminals"; the choice "depends on the stator coils' voltage rating and the supply voltage" |
| Terminal box | The links in this model join the three winding ends: a star connection. | M, S6 | The model links the back row of studs. S6's star step connects "the ends of each winding (U2, V2, and W2)". |
| Stator core | A stack of thin insulated laminations; slots around the bore hold the windings. | S9, M | S9: cores of "thin iron sheets coated with an insulating layer". The slots are in the model. |
| Stator core | Steel carries flux far more easily than air. | S9 | Cores are "used to confine and guide magnetic fields"; field lines are "concentrated in the core material" |
| Stator core | Laminations limit eddy currents. | S4, S9 | S9: insulation layers "serve as a barrier to eddy currents". S4 says the same. |
| Stator core | 36 slots | M | `machine.statorSlots` |
| Windings | Three phases (U, V, W) peak in turn and together produce a field that rotates while the coils stay still. | S8, S6 | S8: three 120° phased waves give "a single rotating vector" of constant magnitude. S6 gives the U/V/W terminal naming. |
| Windings | Four poles, so at 50 Hz the field turns at 1500 r/min. | C, S3, M | n_s = 120 × 50 / 4 = 1500. S3 lists 1500 r/min for 4 poles at 50 Hz. Pole count from the slot table. |
| Rotor core | A lamination stack on the shaft, separated from the stator by an air gap, carrying flux and holding the bars | S2, M | S2: the core is "built with stacks of electrical steel laminations" |
| Rotor core | Skew smooths torque and reduces noise. | S1, S2 | S2: skew is used to "reduce noise and smooth out torque fluctuations" |
| Squirrel cage | Aluminium bars joined at both ends by shorting rings | S2 | Bars are "connected at both ends by shorting rings"; bars "may be made of either copper or aluminium" |
| Squirrel cage | The field induces voltages in the bars, current flows around the cage, and the force on those currents turns the rotor. | S1, S2 | S2: the field "induces electric current in the conductive bars". S1: rotor current "that produces torque is obtained by electromagnetic induction". |
| Squirrel cage | No supply is wired to the rotor; its current is induced, hence "induction motor". | S1 | Same S1 lead sentence |
| Shaft | A key at the drive end; the fan at the other end; rotor, shaft and fan turn together. | M | `build_shaft` (keyway and key), `build_fan`, spin flags (asserted in model.test.mjs) |
| Bearings | The inner ring turns with the shaft, the outer ring stays still, and the balls roll between them. | S10, M | S10: "one race is stationary and the other is attached to the rotating assembly". In the model the inner ring has spin `rotor` and the outer ring none. |
| Bearings | The air gap in this model is 0.8 mm. | M | As above |
| End shields | Also called end bells or end brackets; they bolt to the frame. In this model each has a spigot and a bearing hub that keep the shaft centred. | M | Described from the model's geometry; the wording was narrowed to the model. |
| End shields | DE means drive end; NDE means non-drive end, the fan end on this motor. | S11, M | S11: fans are "generally shaft mounted on the non-drive end", and it also uses "drive end (DE)" |
| Fan | It draws air through the grille and blows it along the fins, and turns whenever the motor turns. | S5, M | S5: "a small fan on the rear shaft of the motor" |
| Fan | Straight radial blades cool equally in either direction. | S7 | Describes radial blades with cooling independent of rotation direction |
| Fan cover | Guards the fan, ducts its air, and takes air in at the grille | S5, M | Covered fan on the rear shaft; grille modelled at the end |
| Operate | Phase currents peak in turn so the field rotates; the rotor follows a little slower. | S1, S8 | S1: an induction motor "always operates slightly slower than synchronous speed" |
| Operate | Real motors typically run a few percent below field speed. | S1 | Design B slip "varies from about 0.5% to 5.0%" |
| Operate | Swapping any two supply phases reverses the field, and the motor turns the other way. | S1, C | "can be reversed by swapping any two of its phase connections". The supply experiments below calculate it for each pair. |
| Operate | The field-pole markers come from idealised balanced currents in this winding. | C | `northPoleAngle` agrees with the stepped MMF of the exported slot table to within 5° (fieldMath.test.mjs) |
| Operate | Playback speed, the 20 % slip and the disassembly order are presentation choices. | D | Stated in the UI next to every animated element |
| Calculator | n_s = 120 f / p with p the total number of poles; results for 2–8 poles at 50 and 60 Hz | C, S1, S3 | S1 defines p as "the number of magnetic poles". All eight reference values match S3 exactly. |
| Calculator | The rotor turns slower by an amount that depends on load; the calculator does not predict shaft speed. | S1, D | Slip definition in S1 |
| Quiz | The stator stays still; the rotor, fan and bearing inner rings turn. | S10, M | Definitional, and consistent with the spin flags. Housing is not offered, so the question has one correct answer. |

## Supply experiments (ENG-002A)

The Operate tab has a Supply menu: the normal supply, three ways to swap two phases, and three ways to open one phase (single-phasing). Each choice restarts the motor from rest. The field dial in 3D, the 2D end view, the copper glow, the phase plot and the readouts all come from `windingCurrents`, `statorField` and `turningParts` in `fieldMath.ts`, tested in `docs/engineering/checks/fieldMath.test.mjs`.

**The idealisation, stated in the UI.** Every winding has the same impedance, so its current follows its voltage. The common lag is dropped, because it shifts every current equally in time and leaves the field's shape alone. The winding is star-connected, as the model's terminal links show. With one phase open, the motor is at rest; that is the case the experiment shows, since it cannot start. At rest, a three-phase induction motor offers the same impedance to the field's forward- and backward-turning parts, because the rotor moves at full slip relative to both. The figures follow from that model by circuit analysis (basis C). They have not been checked against a measured motor, and no textbook derivation was consulted.

| Where | Claim (paraphrased) | Basis | Evidence |
|---|---|---|---|
| Supply menu, reversal | Swapping the supply to any two windings reverses the field, whichever pair is swapped. | S1, C | S1: "can be reversed by swapping any two of its phase connections". Test: for U–V, V–W and W–U the field's peak keeps 3/2 and moves 45 mechanical degrees clockwise per quarter cycle. |
| Reversal | The order in which the phases peak sets the motor's direction. | S13, C | S13: phases must be "connected in the correct order to achieve the intended direction of rotation". Test: the swapped windings peak in reverse order. |
| Reversal | Each winding still carries a full, balanced current, so the field keeps its strength and speed. | C | `windingCurrents` only exchanges two windings' currents; strength stays 3/2 at every sampled instant (test). |
| Reversal | A motor that must change direction often, such as a hoist's, has extra contacts in its controller to do this. | S1 | Motors that change direction regularly, "such as hoists", have "extra switching contacts in their controller". |
| Phase open | With one phase open, no current flows in that winding. The other two are in series, so they carry one current in opposite directions. | C, M, S6 | Kirchhoff's current law at the star point of this model's star connection (M; S6 describes the star links). Test: the open winding is 0 and the three currents sum to 0 at every instant. |
| Phase open, readout | At rest, that current is √3/2, about 87 %, of a normal start. | C, S13 | The two windings sit across a line-to-line voltage, which is "√3 times the line-to-neutral voltage" (S13), through twice the impedance: (√3 × V) / (2 Z). Test: peak currents U and W are √3/2 with V open. |
| Phase open | The field stops turning. It pulses on a fixed axis, fading to zero and returning with north and south swapped. | C, S12 | Test: with W open, every MMF peak lies at 40° or 130° mechanical, between 0 and 3/2. The axes found from the 36-slot table agree within 5°. S12: a single-phase field "alternates (reverses polarity) between pole pairs". |
| Phase open (not shown to learners) | The pulsing axis lies 90 electrical degrees from the open winding's axis. | C | Test: axes 100°/10°, 70°/160° and 40°/130° for U, V and W open. |
| Phase open, readout | A pulsing field acts like two half-strength fields turning in opposite directions. | C, S12, S1 | `turningParts` gives 3/4 forward and 3/4 backward (test). S12: it "can be viewed as two fields rotating in opposite directions". S1: the rotor "is subject to two rotating magnet fields". |
| Phase open, readout | At rest their pulls cancel, so the motor cannot start. | S1, C | S1, Double revolving field: torque "is the result of the difference between these two rotating fields", and "No torque is developed when the rotor is stopped". The equal parts are calculated (C). |
| Phase open | Its windings still draw current and heat up, so protection must switch it off. | C, S15 | Current at rest from the row above. S15: without protection, motors keep operating, "the excessive current causing the motor to overheat". |
| Phase open | A motor already running when a phase opens usually keeps turning, but heats up quickly. | S14, S15 | S14: the motor "will continue to operate" but "will heat up very quickly". S15: it keeps driving its load until it burns out or protection takes it off line. |
| Phase open | A blown fuse or a worn contact in the motor starter can open a phase. | S14, S15 | S14: single phasing can follow "a fuse blowing". S15: worn starter contacts "are the most common single-phasing cause". |
| Readouts | Field direction, strength now, turning parts and current at rest are calculated, idealised values for this winding, starting from rest. | C, D | Stated under the readouts in the UI. |
| Rotor | The rotor shows only whether the field can start it; its speed stays illustrative. | D | The demonstration's slip and playback speed are unchanged presentation choices. Acceleration and the running single-phase case are not animated. |
| Fault question | If a fuse on one phase blows while the motor is stopped, it cannot start, but current still flows and heats it. | S1, S14, S15, C | As the phase-open rows above. Wrong answers explain why a motor would not start or run backwards. |

Wording deliberately avoided: "hums". Many trade articles say a single-phased motor hums at rest, but no source above states it, so the studio says only that the motor cannot start while current flows.

## Changes made because of this review

- TEFC fact: "never flows through" became "is kept from circulating through", matching S5.
- End-shield detail: a general machining claim was replaced by a description of this model's spigot and bearing hub.
- The UI's source list gained S9, S10 and S11, so every row above traces to a listed source.
- ENG-002A: the UI's source list gained S12–S15. OPERATE_NOTES.field no longer says "balanced", because the supply can now be unbalanced. The About panel says which supplies are calculated and that the rotor shows only whether the field can start it.

## Open items for a subject-matter reviewer

- The explanations are short and introductory. They have not been reviewed by a qualified electrical engineer or a lecturer.
- Wikipedia and a vendor blog (S6) are adequate for an introduction. They are not authoritative standards: IEC 60034 and a manufacturer manual would be.
- The generated 3D geometry is educational. Proportions are plausible for an IEC 132-size motor, not checked against a manufacturer drawing.
- Single-phasing is modelled only at rest, for a star connection, with equal winding impedances and no saturation. A running motor that loses a phase draws more than its normal current: S15 gives 173 % rising to about 200 %. The studio states this case in words and does not calculate it. A delta-connected motor would also pulse, with different winding currents.
- S14 was read as an abstract only. S15 is a fuse manufacturer's handbook. A machines textbook or IEC 60034 would be a stronger basis for the single-phasing and double-revolving-field claims.
