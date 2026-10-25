// Issue #5: synthetic-only acceptance inventory. A preflight pass is NOT browser evidence.
export const journeyStages = Object.freeze([
  {id:'J01',route:'/account',source:'account/AccountPage.tsx',marker:'Your place to keep learning.',check:'View account boundary without signing in'},
  {id:'J02',route:'/sources',source:'workspace/SourceWorkspace.tsx',marker:'Try the shopkeeper sample',check:'Open non-private sample source'},
  {id:'J03',route:'/sources',source:'workspace/SourceWorkspace.tsx',marker:'Save reviewed text',check:'Acknowledge and save reviewed revision'},
  {id:'J04',route:'/classroom',source:'source-classroom/SourceClassroom.tsx',marker:'Read chapter aloud',check:'Open source-linked reading with visible chapter text'},
  {id:'J05',route:'/studios',source:'kairo/Studios.tsx',marker:'See how the idea works.',check:'Visit prepared studio without suggesting uploaded-source simulation'},
  {id:'J06',route:'/classroom',source:'kairo/JourneyPanels.tsx',marker:'Try it in your own words.',check:'Attempt source-linked practice without claiming mastery'},
  {id:'J07',route:'/evidence',source:'kairo/JourneyPanels.tsx',marker:'Download my lesson & working',check:'Keep notes and check synthetic Markdown download'},
  {id:'J08',route:'/saved',source:'continuity/LearningHome.tsx',marker:'Saved reading copy',check:'Reload, resume and recover from offline via a saved reading copy'},
]);
export const viewports = Object.freeze([
  {id:'D01',name:'narrow-phone',width:360,height:780},
  {id:'D02',name:'large-phone',width:430,height:932},
  {id:'D03',name:'tablet',width:768,height:1024},
  {id:'D04',name:'desktop',width:1280,height:800},
]);
export const accessChecks = Object.freeze([
  {id:'A01',name:'Keyboard-only navigation and visible focus',kind:'browser-plus-human'},
  {id:'A02',name:'Text captions and narration stop without microphone activation',kind:'browser-plus-human'},
  {id:'A03',name:'Native browser 200% text zoom and no clipped controls',kind:'human-device'},
  {id:'A04',name:'Reduced-motion preference and manual toggle',kind:'browser-plus-human'},
  {id:'A05',name:'Screen-reader names, landmarks, state announcements and order',kind:'human-device'},
  {id:'A06',name:'Contrast, reflow and focus at all four viewports',kind:'browser-plus-human'},
  {id:'A07',name:'Download content, source revision and safe resume/recovery',kind:'browser-plus-human'},
]);
