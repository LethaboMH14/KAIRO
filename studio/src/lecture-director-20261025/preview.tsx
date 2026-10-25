import React from 'react';
import {createRoot} from 'react-dom/client';
import TeacherProvider from '../teacher/TeacherProvider.tsx';
import LectureDirector from './LectureDirector.tsx';
// Development-only direct HTML entry, NOT a production router mount.
// Wrap once with the existing KAIRO single narrator for an isolated preview.
const target=document.getElementById('root');
if(!target)throw Error('Lecture Director preview root missing.');
createRoot(target).render(<React.StrictMode><TeacherProvider><LectureDirector/></TeacherProvider></React.StrictMode>);
