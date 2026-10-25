import test from 'node:test';
import assert from 'node:assert/strict';
import {checkedStep,explainAnchor,preparedAnswer,checkStockAnswer} from '../src/experience/session.ts';
test('tap explanations distinguish intermediate, expected and observed quantities',()=>{assert.match(explainAnchor(32),/Sales have not/);assert.match(explainAnchor(23),/expected/);assert.match(explainAnchor(22),/observed/);assert.equal(explainAnchor(999),null);});
test('prepared questions never fabricate an answer beyond the authored lesson',()=>{assert.match(preparedAnswer('Why is the count different?'),/Check the records/);assert.match(preparedAnswer('Who stole it?'),/prepared example/);assert.match(preparedAnswer('Explain the delivery'),/twenty plus twelve/);});
test('navigation and answer checks reject empty or non-finite values',()=>{assert.equal(checkedStep(NaN),0);assert.equal(checkedStep(-2),0);assert.equal(checkedStep(99),2);assert.equal(checkStockAnswer('').correct,false);assert.equal(checkStockAnswer('Infinity').correct,false);assert.equal(checkStockAnswer('22').correct,false);assert.equal(checkStockAnswer('23').correct,true);});
