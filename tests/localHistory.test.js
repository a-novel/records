import {LocalHistory} from '../src/index';
import {describe, it, expect} from '@jest/globals';

describe(
	'test localHistory constructor',
	() => {
		it('should support empty declaration', () => {
			const recorder = new LocalHistory();

			expect(recorder.getValue()).toEqual('');
			expect(recorder.getRecords().length).toEqual(0);
			expect(recorder.lastActiveIndex()).toEqual(-1);
		});

		it('should initialize with content and no records', () => {
			const recorder = new LocalHistory('hello world');

			expect(recorder.getValue()).toEqual('hello world');
			expect(recorder.getRecords().length).toEqual(0);
			expect(recorder.lastActiveIndex()).toEqual(-1);
		});

		it('should initialize with records', () => {
			const recorder = new LocalHistory(
				'',
				[
					{from: '', to: 'hello', caret: {start: 0, end: 0}, active: true},
					{from: '', to: ' world', caret: {start: 5, end: 5}, active: false}
				]
			);

			expect(recorder.getValue()).toEqual('hello');
			expect(recorder.getRecords().length).toEqual(2);
			expect(recorder.lastActiveIndex()).toEqual(0);
			expect(recorder.checkIntegrity()).toEqual('');
		});
	}
);

describe(
	'test localHistory basic methods',
	() => {
		it('should update value on push', () => {
			const recorder = new LocalHistory();

			recorder.push({to: 'hello mama', caret: {start: 0, end: 0}});

			expect(recorder.checkIntegrity()).toEqual('');
			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(0);
			expect(recorder.getValue()).toEqual('hello mama');

			recorder.push({to: 'world', caret: {start: 6, end: 10}});

			expect(recorder.checkIntegrity()).toEqual('');
			expect(recorder.getRecords().length).toEqual(2);
			expect(recorder.lastActiveIndex()).toEqual(1);
			expect(recorder.getValue()).toEqual('hello world');
		});

		it('should go back to empty on rollback', () => {
			const recorder = new LocalHistory('hello mama');
			recorder.push({to: 'world', caret: {start: 6, end: 10}});

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(0);
			expect(recorder.getValue()).toEqual('hello world');

			recorder.revert(1);

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(-1);
			expect(recorder.getValue()).toEqual('hello mama');

			recorder.revert(1);

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(-1);
			expect(recorder.getValue()).toEqual('hello mama');
		});

		it('should fallback on last value when redoing all undone changes', () => {
			const recorder = new LocalHistory('hello mama');
			recorder.push({to: 'world', caret: {start: 6, end: 10}});
			recorder.revert(1);
			recorder.revert(1);

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(-1);
			expect(recorder.getValue()).toEqual('hello mama');

			recorder.apply(Infinity);

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(0);
			expect(recorder.getValue()).toEqual('hello world');

			recorder.apply(1);

			expect(recorder.getRecords().length).toEqual(1);
			expect(recorder.lastActiveIndex()).toEqual(0);
			expect(recorder.getValue()).toEqual('hello world');
		});
	}
);

const sampleRecorder1 = () => {
	const recorder = new LocalHistory();

	recorder.push({to: 'h', caret: {start: 0, end: 0}});
	recorder.push({to: 'e', caret: {start: 1, end: 1}});
	recorder.push({to: 'w', caret: {start: 2, end: 2}});
	recorder.push({to: 'l', caret: {start: 2, end: 3}});
	recorder.push({to: 'l', caret: {start: 3, end: 3}});
	recorder.push({to: 'o', caret: {start: 4, end: 4}});
	recorder.push({to: ' ', caret: {start: 5, end: 5}});
	recorder.push({to: ' ', caret: {start: 6, end: 6}});
	recorder.push({to: '\t', caret: {start: 7, end: 7}});
	recorder.push({to: 'm', caret: {start: 8, end: 8}});
	recorder.push({to: 'a', caret: {start: 9, end: 9}});
	recorder.push({to: 'm', caret: {start: 10, end: 10}});
	recorder.push({to: 'a', caret: {start: 11, end: 11}});
	recorder.push({to: 'w', caret: {start: 5, end: 5}});
	recorder.push({to: 'o', caret: {start: 6, end: 6}});
	recorder.push({to: 'r', caret: {start: 7, end: 7}});
	recorder.push({to: 'l', caret: {start: 8, end: 8}});
	recorder.push({to: 'd', caret: {start: 9, end: 9}});
	
	return recorder;
};

describe(
	'test localHistory chained methods',
	() => {
		it('should perform expected revert with splitOnBlankSpace', () => {
			const recorder = sampleRecorder1();

			expect(recorder.getValue()).toEqual('helloworld  \tmama');

			recorder.revertChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('hello  \t');

			recorder.revertChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('hello');

			recorder.revertChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('');

			recorder.revertChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('');

			recorder.applyChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('hello');

			recorder.applyChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('hello  \t');

			recorder.applyChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('helloworld  \tmama');

			recorder.applyChain(LocalHistory.splitOnBlankSpace);

			expect(recorder.getValue()).toEqual('helloworld  \tmama');
		});
		
		it('should perform expected revert with keepContinuity', () => {
			const recorder = sampleRecorder1();

			expect(recorder.getValue()).toEqual('helloworld  \tmama');

			recorder.revertChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('hello  \tmama');

			recorder.revertChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('');

			recorder.revertChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('');

			recorder.applyChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('hello  \tmama');

			recorder.applyChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('helloworld  \tmama');

			recorder.applyChain(LocalHistory.keepContinuity);

			expect(recorder.getValue()).toEqual('helloworld  \tmama');
		});
	}
);