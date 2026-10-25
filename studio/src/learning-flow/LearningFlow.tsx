import FlowRail from '../learning-flow-ui/FlowRail';
import {useStudentSpace} from '../student-space/StudentSpace';
import {flowFor} from './model';
export default function LearningFlow({path}:{path:string}){const {space}=useStudentSpace();const search=typeof location==='undefined'?'':location.search;if(!['/sources','/classroom','/learn','/lesson-editor','/engineering','/pump-lab','/computer-science','/evidence','/direction'].includes(path))return null;if(path==='/classroom'&&!new URLSearchParams(search).has('lesson'))return null;return <FlowRail {...flowFor(path,search,space)}/>;}

