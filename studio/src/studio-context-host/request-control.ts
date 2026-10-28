/** Abort local waiting and invalidate late results; already-sent provider work may finish. */
export function revokeStudioRequest({controller,invalidate,clearAnswer,stopNarration,status}:{controller:AbortController|null;invalidate:()=>void;clearAnswer:()=>void;stopNarration:()=>void;status:(text:string)=>void}){
 invalidate();controller?.abort();clearAnswer();stopNarration();status('Stopped waiting. Already-sent provider work may still finish; its result will not be shown.');
}
