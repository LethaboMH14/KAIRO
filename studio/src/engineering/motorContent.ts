// Prepared lesson content for the Engineering Studio. Claims were checked
// against the sources listed in SOURCES; see docs/engineering/content-review.md.
// Types only: docs/engineering/checks load this file directly in Node, which
// strips types but cannot resolve the studio's extensionless imports.
import type { Phase, Supply } from './fieldMath';

export const PART_IDS = [
  'housing', 'terminal-box', 'stator-core', 'stator-windings', 'rotor-core', 'rotor-cage', 'shaft',
  'bearing-de', 'bearing-nde', 'end-shield-de', 'end-shield-nde', 'fan', 'fan-cover',
] as const;
export type PartId = (typeof PART_IDS)[number];

export type Motion = 'stationary' | 'rotates' | 'mixed';

export type Part = {
  id: PartId;
  item: number;
  name: string;
  role: string;
  detail: string;
  fact: string;
  motion: Motion;
  /** Hidden by other parts when the motor is assembled and uncut. */
  inside: boolean;
};

export const MOTION_LABEL: Record<Motion, string> = {
  stationary: 'Stays still',
  rotates: 'Turns with the shaft',
  mixed: 'Inner ring turns, outer ring stays still',
};

const bearingDetail = 'A ball bearing supports each end of the shaft. Its inner ring turns with the shaft, its outer ring sits still in the end shield, and steel balls roll between the two, so the rotor turns freely without touching the stator.';
const shieldDetail = 'End shields, also called end bells or end brackets, bolt to each end of the frame. In this model each one has a spigot that fits inside the frame and a hub that holds a bearing, which keeps the shaft on the centre line of the stator bore.';

export const PARTS: readonly Part[] = [
  {
    id: 'housing', item: 1, name: 'Housing', role: 'Holds the stator and sheds heat.',
    detail: 'The frame is the motor’s body. It grips the stator core, carries the end shields that centre the rotor, and stands on two drilled feet. Its fins add surface area: air from the shaft-mounted fan flows along them and carries away heat from losses in the windings and steel.',
    fact: 'This enclosure is called TEFC: totally enclosed, fan-cooled. Outside air is kept from circulating through the inside of the motor.',
    motion: 'stationary', inside: false,
  },
  {
    id: 'terminal-box', item: 2, name: 'Terminal box', role: 'Where the three-phase supply connects.',
    detail: 'Supply cables enter through the gland and fasten to a terminal board. Its six studs are the start and end of each of the three phase windings, so short links can join the windings in star or in delta to suit the supply voltage.',
    fact: 'The links in this model join the three winding ends on the back row: a star connection.',
    motion: 'stationary', inside: false,
  },
  {
    id: 'stator-core', item: 3, name: 'Stator core', role: 'Stationary steel that guides the magnetic field.',
    detail: 'A stack of thin, insulated steel sheets called laminations, pressed into the frame. Slots around its bore hold the windings. Steel carries magnetic flux far more easily than air, and building it from laminations limits the eddy currents a changing field would drive through solid metal.',
    fact: 'This model’s stator has 36 slots.',
    motion: 'stationary', inside: true,
  },
  {
    id: 'stator-windings', item: 4, name: 'Stator windings', role: 'Copper coils that create the rotating magnetic field.',
    detail: 'Insulated copper coils sit in the slots in three groups called phases: U, V and W. Fed with three-phase alternating current, the phase currents peak one after another, so together they produce a magnetic field that turns around the bore while the coils themselves stay still.',
    fact: 'The coils here are arranged for four poles, so on a 50 Hz supply the field turns at 1500 r/min.',
    motion: 'stationary', inside: true,
  },
  {
    id: 'rotor-core', item: 5, name: 'Rotor core', role: 'Carries the field through the rotor.',
    detail: 'The rotor is another stack of laminations, pressed onto the shaft and separated from the stator by a narrow air gap. It carries magnetic flux across that gap and holds the cage bars in its slots.',
    fact: 'Its slots twist slightly along its length. This skew smooths the torque and reduces noise.',
    motion: 'rotates', inside: true,
  },
  {
    id: 'rotor-cage', item: 6, name: 'Squirrel cage', role: 'Bars where current is induced.',
    detail: 'Aluminium bars run through the rotor slots and are joined at both ends by shorting rings. As the stator’s field sweeps past, it induces voltages in the bars. Current flows around the cage, and the force on those currents in the magnetic field turns the rotor.',
    fact: 'No supply is wired to the rotor. Its current is induced, which is why this is called an induction motor.',
    motion: 'rotates', inside: true,
  },
  {
    id: 'shaft', item: 7, name: 'Shaft', role: 'Delivers the turning force.',
    detail: 'The steel shaft runs through the rotor and both bearings. At the drive end, a key locks a pulley or coupling to it; the other end carries the cooling fan. Rotor, shaft and fan turn as one assembly.',
    fact: 'Watch the key on the drive end to follow the shaft as it turns.',
    motion: 'rotates', inside: false,
  },
  {
    id: 'bearing-de', item: 8, name: 'Drive-end bearing', role: 'Supports the shaft at the load end.',
    detail: bearingDetail,
    fact: 'The air gap in this model is 0.8 mm, so the bearings must hold the rotor precisely.',
    motion: 'mixed', inside: true,
  },
  {
    id: 'bearing-nde', item: 9, name: 'Fan-end bearing', role: 'Supports the shaft at the fan end.',
    detail: bearingDetail,
    fact: 'With a bearing at each end, the rotor is held on a single straight axis.',
    motion: 'mixed', inside: true,
  },
  {
    id: 'end-shield-de', item: 10, name: 'Drive-end shield', role: 'Closes the frame and holds a bearing.',
    detail: shieldDetail,
    fact: 'DE stands for drive end: the end that connects to the machine being driven.',
    motion: 'stationary', inside: false,
  },
  {
    id: 'end-shield-nde', item: 11, name: 'Fan-end shield', role: 'Closes the frame and holds a bearing.',
    detail: shieldDetail,
    fact: 'NDE stands for non-drive end. On this motor it is the fan end.',
    motion: 'stationary', inside: false,
  },
  {
    id: 'fan', item: 12, name: 'Cooling fan', role: 'Pushes cooling air over the frame.',
    detail: 'Fixed to the non-drive end of the shaft, the fan draws air in through the cover grille and blows it along the outside of the finned frame. Because it is on the shaft, it turns whenever the motor turns.',
    fact: 'Its straight, radial blades cool equally well in either direction of rotation.',
    motion: 'rotates', inside: true,
  },
  {
    id: 'fan-cover', item: 13, name: 'Fan cover', role: 'Guards the fan and directs its air.',
    detail: 'The cowl keeps fingers and objects away from the spinning fan and channels its airflow along the fins. Air enters through the grille at the end.',
    fact: 'It works as a guard and as an air duct.',
    motion: 'stationary', inside: false,
  },
];

export const PART_BY_ID = Object.fromEntries(PARTS.map(part => [part.id, part])) as Record<PartId, Part>;

export type Mode = 'inspect' | 'explode' | 'operate';

export const MODE_CAPTION: Record<Mode, string> = {
  inspect: 'Drag to orbit and scroll or pinch to zoom. Select a part in the model or in the list.',
  explode: 'The parts slide apart along the shaft, roughly in the order a technician removes them. Stop the slider anywhere.',
  operate: 'Three-phase currents peak in turn, so the field rotates. The rotor follows a little slower than the field. Speeds here are slowed and not to scale.',
};

export const CUTAWAY_NOTE = 'A quarter section is cut away so you can see inside. Real motors are fully enclosed; the cut is an inspection aid.';

export const OPERATE_NOTES = {
  field: 'Field poles: where the stator’s field is strongest, calculated from idealised phase currents for the chosen supply.',
  rotor: 'Rotor pointer: turns with the shaft. It lags the field because of slip, which this demonstration exaggerates. Real motors typically run a few percent below field speed.',
  reverse: 'Swapping any two supply phases reverses the field, and the motor turns the other way.',
  paused: 'Operation is paused while the motor is taken apart. Reassemble it to run the demonstration.',
  tryIt: 'Try it with the Supply menu below the model, or open one phase to see a common fault.',
};

/** Readouts for the supply experiments, keyed by which way the calculated field turns. */
export const EXPERIMENT_READOUT = {
  field: { forward: 'Turns anticlockwise', backward: 'Turns clockwise', still: 'Pulses on a fixed axis' },
  start: { forward: 'Starts and runs', backward: 'Starts and runs in reverse', still: 'Cannot start: no starting torque' },
  note: 'Calculated from idealised currents in this model’s winding, with the motor starting from rest. The rotor shows only whether the field can start it; its speed stays illustrative.',
};

/** A supply experiment for the operating demonstration. Every choice restarts the motor from rest. */
export type SupplyChoice = {
  id: string;
  label: string;
  group: 'normal' | 'reverse' | 'fault';
  supply: Supply;
  title: string;
  caption: string;
  explanation: readonly string[];
  plotNote: string;
  plotDescription: string;
};

const REVERSE_EXPLANATION = 'Each winding still carries a full, balanced current, but the two swapped phases now peak in the opposite order. The field turns the other way at the same speed and strength, so the motor runs in reverse. A motor that must change direction often, such as a hoist’s, has extra contacts in its controller to do this.';
const FAULT_START = 'A field that only pulses acts like two half-strength fields turning in opposite directions. At rest their pulls on the rotor cancel, so the motor cannot start, yet its windings still draw current and heat up.';
const FAULT_RUNNING = 'A motor that is already running when a phase opens usually keeps turning, but it heats up quickly, so protection must switch it off. A blown fuse or a worn contact in the motor starter can open a phase.';

function swapChoice(a: Phase, b: Phase): SupplyChoice {
  return {
    id: `swap-${a}${b}`, label: `${a} and ${b} swapped`, group: 'reverse',
    supply: { kind: 'swapped', lines: [a, b] },
    title: `Two phases swapped: ${a} and ${b}`,
    caption: `${a} and ${b} swapped: the field turns the other way, so the rotor runs in reverse.`,
    explanation: [REVERSE_EXPLANATION],
    plotNote: `Idealised: ${a} and ${b} swapped`,
    plotDescription: `Three equal sine waves. With ${a} and ${b} swapped, the peaks come in the reverse order.`,
  };
}

function openChoice(line: Phase): SupplyChoice {
  const [a, b] = (['U', 'V', 'W'] as const).filter(phase => phase !== line);
  return {
    id: `open-${line}`, label: `Phase ${line} open`, group: 'fault',
    supply: { kind: 'open', line },
    title: `One phase open: ${line}`,
    caption: `Phase ${line} open: the field only pulses on a fixed axis, so the rotor cannot start from rest.`,
    explanation: [
      `No current flows in winding ${line}. Windings ${a} and ${b} are left in series, so they carry one current in opposite directions. The field stops turning: it swells, fades to nothing and swells again with north and south swapped, always on the same axis.`,
      FAULT_START,
      FAULT_RUNNING,
    ],
    plotNote: `Idealised: phase ${line} open, motor at rest`,
    plotDescription: `Winding ${line} carries no current. Windings ${a} and ${b} carry the same current in opposite directions, so their waves are mirror images.`,
  };
}

export const SUPPLY_CHOICES: readonly SupplyChoice[] = [
  {
    id: 'normal', label: 'Normal supply', group: 'normal', supply: { kind: 'normal' },
    title: 'Normal supply',
    caption: MODE_CAPTION.operate,
    explanation: ['Balanced three-phase currents peak in the order U, V, W. The field keeps the same strength and turns steadily, and the rotor follows it.'],
    plotNote: 'Idealised, balanced supply',
    plotDescription: 'Three equal sine waves, U, V and W, each peaking a third of a cycle after the one before.',
  },
  swapChoice('U', 'V'), swapChoice('V', 'W'), swapChoice('W', 'U'),
  openChoice('U'), openChoice('V'), openChoice('W'),
];

export const SUPPLY_BY_ID = Object.fromEntries(SUPPLY_CHOICES.map(choice => [choice.id, choice])) as Record<string, SupplyChoice>;

export const SUPPLY_GROUPS = { reverse: 'Reverse: swap two phases', fault: 'Fault: one phase open' } as const;

export const FAULT_QUIZ = {
  question: 'A fuse on one supply phase blew while this motor was stopped. What happens when it is switched on?',
  options: [
    { id: 'starts', label: 'It starts and runs normally', correct: false, feedback: 'Not quite. With one phase open the field cannot turn. Choose Phase W open in Operate and watch the field poles.' },
    { id: 'reverse', label: 'It runs backwards', correct: false, feedback: 'Not quite. Running backwards needs a field that turns the other way, as when two phases are swapped. With a phase open the field does not turn at all.' },
    { id: 'stalls', label: 'It cannot start, but current still flows and heats it', correct: true, feedback: 'Correct. The field only pulses, which acts like two equal fields turning opposite ways. At rest their pulls cancel, so there is no starting torque, while the windings still draw current. Protection must switch it off.' },
    { id: 'fan', label: 'Only the cooling fan turns', correct: false, feedback: 'Not this one. The fan is fixed to the shaft, so it can only turn when the rotor does.' },
  ] satisfies QuizOption[],
};

export type QuizOption = { id: string; label: string; feedback: string; correct: boolean };

export const STATIONARY_QUIZ = {
  question: 'Which of these parts stays still while the shaft turns?',
  options: [
    { id: 'rotor', label: 'Rotor core and cage', correct: false, feedback: 'Not this one. The rotor is pressed onto the shaft, so it turns with it.' },
    { id: 'stator', label: 'Stator core and windings', correct: true, feedback: 'Correct. The stator is fixed inside the frame. Its windings make the field rotate, but the stator itself never moves.' },
    { id: 'fan', label: 'Cooling fan', correct: false, feedback: 'Not this one. The fan is fixed to the shaft, so it turns whenever the shaft turns.' },
    { id: 'inner-ring', label: 'Bearing inner rings', correct: false, feedback: 'Close. A bearing’s inner ring is fitted to the shaft and turns with it. Only the outer ring stays still.' },
  ] satisfies QuizOption[],
};

export const FIELD_CHECK = {
  question: 'This motor’s winding has four poles. Supplied at 60 Hz, how fast does its field turn?',
  frequencyHz: 60,
  poles: 4,
  hint: 'Multiply 120 by the frequency, then divide by the number of poles.',
};

export type Source = { label: string; url: string; supports: string };

export const SOURCES: readonly Source[] = [
  { label: 'Wikipedia: Induction motor', url: 'https://en.wikipedia.org/wiki/Induction_motor', supports: 'Synchronous speed n_s = 120 f / p, slip, operation below synchronous speed, skew, reversal by swapping two phases, TEFC fins, and the two opposite turning fields that give no torque at standstill.' },
  { label: 'Wikipedia: Squirrel-cage rotor', url: 'https://en.wikipedia.org/wiki/Squirrel-cage_rotor', supports: 'Bars joined by shorting rings, aluminium or copper bars, laminated core, skew, induced current.' },
  { label: 'Engineering ToolBox: synchronous and full-load speeds', url: 'https://www.engineeringtoolbox.com/synchronous-full-load-speed-induction-motors-d_1448.html', supports: 'Reference synchronous speeds for 2, 4, 6 and 8 poles at 50 and 60 Hz, used to test the calculator.' },
  { label: 'Wikipedia: Eddy current', url: 'https://en.wikipedia.org/wiki/Eddy_current', supports: 'Laminated cores reduce eddy currents.' },
  { label: 'Wikipedia: TEFC', url: 'https://en.wikipedia.org/wiki/TEFC', supports: 'Enclosure keeps outside air out; a shaft fan blows air over the frame.' },
  { label: 'Electrical Volt: star and delta connection', url: 'https://electricalvolt.com/3-phase-motor-star-and-delta-connection', supports: 'Six terminals U1–W2, star and delta links, choice by voltage rating.' },
  { label: 'US patent 8,007,241: bi-directional cooling fan', url: 'https://patents.google.com/patent/US8007241', supports: 'Radial blades give cooling independent of rotation direction.' },
  { label: 'Wikipedia: Rotating magnetic field', url: 'https://en.wikipedia.org/wiki/Rotating_magnetic_field', supports: 'Three currents 120° apart give a field of constant magnitude that rotates.' },
  { label: 'Wikipedia: Magnetic core', url: 'https://en.wikipedia.org/wiki/Magnetic_core', supports: 'Steel cores confine and guide magnetic fields; insulated laminations block eddy currents.' },
  { label: 'Wikipedia: Ball bearing', url: 'https://en.wikipedia.org/wiki/Ball_bearing', supports: 'One race stays still while the other turns with the rotating assembly.' },
  { label: 'US patent 10,436,204: motor cooling fan assembly', url: 'https://patents.google.com/patent/US10436204', supports: 'Cooling fans are generally shaft-mounted at the non-drive end; uses the terms drive end (DE) and non-drive end (NDE).' },
  { label: 'Wikipedia: AC motor', url: 'https://en.wikipedia.org/wiki/AC_motor', supports: 'A single-phase field alternates, reversing polarity, and can be viewed as two fields turning in opposite directions.' },
  { label: 'Wikipedia: Three-phase electric power', url: 'https://en.wikipedia.org/wiki/Three-phase_electric_power', supports: 'Line-to-line voltage is √3 times the line-to-neutral voltage; the phase order sets a three-phase motor’s direction.' },
  { label: 'Kersting (2005): Causes and effects of single-phasing induction motors, IEEE Transactions on Industry Applications', url: 'https://doi.org/10.1109/TIA.2005.857467', supports: 'A running motor keeps operating when single-phased but heats up very quickly, so a protective device must remove it from service; a blown fuse is one cause.' },
  { label: 'Eaton Bussmann series: Selecting Protective Devices (2017), section 7.14.10', url: 'http://www.cooperindustries.com/content/dam/eaton/products/electrical-circuit-protection/fuses/technical-literature/bus-ele-br-3002-spd-2017.pdf', supports: 'Single-phasing means one phase is open; unprotected motors overheat; worn starter contacts are the most common cause.' },
];
