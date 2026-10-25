import FlowRail from '../learning-flow-ui/FlowRail';
import {useStudentSpace} from '../student-space/StudentSpace';
import {flowFor} from './model';
export default function LearningFlow({path}:{path:string}){const {space}=useStudentSpace();const search=typeof location==='undefined'?'':location.search;if(!['/sources','/classroom','/learn','/lesson-editor','/engineering','/pump-lab','/computer-science','/evidence','/direction'].includes(path))return null;const params=new URLSearchParams(search),bundle=params.get('bundle');if(path==='/classroom'&&!params.has('lesson')&&!bundle)return null;const flow=flowFor(path,search,space);if(bundle&&/^[a-f0-9]{24}$/.test(bundle)){flow.items=flow.items.map(item=>item.stage==='lesson'?{...item,href:'/classroom?bundle='+bundle,note:undefined}:item.stage==='evidence'?{...item,href:'/classroom?bundle='+bundle+'#bundle-working'}:item);}return <FlowRail {...flow}/>;}

