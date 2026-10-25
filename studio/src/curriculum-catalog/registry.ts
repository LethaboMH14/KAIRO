import { validateRegistry, type CurriculumModule, type CurriculumRegistry } from './model.ts';

const pdf = 'https://www.wits.ac.za/media/wits-university/students/academic-matters/documents/EBE_eBook.pdf';
const checkedAt = '2026-10-23T19:34:36Z';
const qualification = 'Bachelor of Science in Engineering (BSc (Eng))';

const programmes = [
  { id: 'wits-ebe-efa06-aeronautical', institutionId: 'wits', title: 'Aeronautical Engineering', qualification, sourceUrl: pdf },
  { id: 'wits-ebe-efa01-civil', institutionId: 'wits', title: 'Civil Engineering', qualification, sourceUrl: pdf },
  { id: 'wits-ebe-efa03-electrical', institutionId: 'wits', title: 'Electrical Engineering', qualification, sourceUrl: pdf },
  { id: 'wits-ebe-efa05-mechanical', institutionId: 'wits', title: 'Mechanical Engineering', qualification, sourceUrl: pdf },
  { id: 'wits-ebe-efa08-metallurgy-materials', institutionId: 'wits', title: 'Metallurgy and Materials Engineering', qualification, sourceUrl: pdf },
];

const sharedProgrammes = programmes.map(({ id }) => id);
const sharedFirstYearLocator =
  '2026 Senate Rules, current Year of Study I tables: Aeronautical Engineering EFA06 (PDF pp.42–43 / printed pp.40–41); Civil Engineering EFA01 (PDF pp.46–47 / printed pp.44–45); Electrical Engineering EFA03 (PDF pp.48–49 / printed pp.46–47); Mechanical Engineering EFA05 (PDF pp.52–53 / printed pp.50–51); Metallurgy and Materials Engineering EFA08 (PDF pp.54–55 / printed pp.52–53). Exact course row follows.';

const firstYear = [
  ['CHEM1051A', 'Engineering Chemistry', 'chemistry'],
  ['FEBE1000A', 'Introduction to the Engineering Profession', 'engineering-profession'],
  ['FEBE1002A', 'Engineering Analysis and Design IA', 'engineering-design'],
  ['FEBE1004A', 'Engineering Analysis and Design IB', 'engineering-design'],
  ['MATH1048A', 'Engineering Mathematics IA', 'mathematics'],
  ['MATH1049A', 'Engineering Mathematics IB', 'mathematics'],
  ['PHYS1032A', 'Engineering Physics IA', 'physics'],
  ['PHYS1033A', 'Engineering Physics IB', 'physics'],
  ['PHYS1034A', 'Applied Physics I', 'physics'],
] as const;

const modules: CurriculumModule[] = firstYear.map(([code, title, concept]) => ({
  id: `wits-2026-${code}`,
  institutionId: 'wits',
  catalogueYear: 2026,
  code,
  title,
  studyYear: 1,
  programmeIds: sharedProgrammes,
  conceptIds: [concept],
  source: {
    url: pdf,
    locator: `${sharedFirstYearLocator} ${code} — ${title}.`,
    checkedAt,
    evidenceStatus: 'original-reviewed' as const,
  },
  status: 'reviewed' as const,
}));

modules.push({
  id: 'wits-2026-ELEN2003A',
  institutionId: 'wits',
  catalogueYear: 2026,
  code: 'ELEN2003A',
  title: 'Electric and Magnetic Systems',
  studyYear: 2,
  programmeIds: ['wits-ebe-efa03-electrical'],
  conceptIds: ['electric-fields', 'magnetic-fields', 'electromagnetic-induction', 'energy-conversion'],
  source: {
    url: pdf,
    locator: '2026 Senate Rules: Electrical Engineering EFA03, Year of Study II, PDF p.48 / printed p.46. Detailed syllabus: School of Electrical and Information Engineering, Course Code ELEN2003A, PDF p.294 / printed p.292; course description explicitly lists electro-magnetic induction, coupling, transformers, power and energy conversion, and electrical fields.',
    checkedAt,
    evidenceStatus: 'original-reviewed',
  },
  status: 'reviewed',
});

const targets = [
  ['electrical', 'Electrical Engineering', 'https://www.wits.ac.za/course-finder/undergraduate/ebe/electrical-engineering/'],
  ['mechanical', 'Mechanical Engineering', 'https://www.wits.ac.za/course-finder/undergraduate/ebe/mechanical-engineering/'],
  ['aeronautical', 'Aeronautical Engineering', 'https://www.wits.ac.za/course-finder/undergraduate/ebe/aeronautical-engineering/'],
  ['metallurgy-materials', 'Metallurgy and Materials Engineering', 'https://www.wits.ac.za/course-finder/undergraduate/ebe/metallurgy-and-materials-engineering/'],
  ['civil', 'Civil Engineering', 'https://www.wits.ac.za/course-finder/undergraduate/ebe/civil-engineering/'],
  ['construction-studies', 'Construction Studies', 'https://www.wits.ac.za/cem/undergraduate-study/'],
  ['computer-science', 'Computer Science', 'https://www.wits.ac.za/course-finder/undergraduate/science/computer-science/'],
  ['information-systems', 'Information Systems', 'https://www.wits.ac.za/course-finder/undergraduate/commerce/information-systems/'],
] as const;

const registry: CurriculumRegistry = {
  programmes,
  modules,
  discoveryLeads: targets.map(([id, title, url]) => ({
    id,
    title,
    url,
    status: 'discovery-only',
    note: 'Programme-page discovery lead only; not a full reviewed curriculum, module choice, or learner enrolment.',
  })),
};

export const curriculumRegistry = validateRegistry(registry);
