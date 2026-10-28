import test from 'node:test';
import assert from 'node:assert/strict';
import {microphoneAllowedByPolicy} from '../src/learner-reasoning-ui/audioCapture.ts';

test('a Permissions-Policy that blocks the microphone hides dictation instead of failing at permission time',()=>{
 assert.equal(microphoneAllowedByPolicy({permissionsPolicy:{allowsFeature:f=>f!=='microphone'}}),false);
 assert.equal(microphoneAllowedByPolicy({featurePolicy:{allowsFeature:()=>false}}),false);
 assert.equal(microphoneAllowedByPolicy({permissionsPolicy:{allowsFeature:()=>true}}),true);
});
test('browsers without a policy API, or a throwing one, are not treated as blocked',()=>{
 assert.equal(microphoneAllowedByPolicy({}),true);
 assert.equal(microphoneAllowedByPolicy(undefined),true);
 assert.equal(microphoneAllowedByPolicy({permissionsPolicy:{allowsFeature(){throw new Error('x');}}}),true);
});
