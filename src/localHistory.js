// Created and maintained by Kushuh.
// https://github.com/Kushuh - kuzanisu@gmail.com

/**
 * Represent a caret range within a rendered string. Caret goes from content[start] to content[end].
 *
 * @typedef {{start: number, end: number}} Caret
 */

/**
 * Record data about a modification.
 *
 * @typedef {{
 *   from?: string,
 *	 to?: string,
 *	 caret: Caret,
 *	 active?: boolean,
 * }} HistoryRecord
 */
/**
 * Record modifications on a string editor for a local single user.
 *
 * @version 1.0.0
 * @author [Kushuh](https://github.com/Kushuh)
 */
class LocalHistory {
	/**
	 * @param {string=} content
	 * @param {HistoryRecord[]=} records
	 */
	constructor(content, records) {
		const hasRecords = records != null && records.length > 0;
		const hasContent = content != null && content !== '';

		if (hasContent) {
			this.#value = content;
			this.#initialValue = content;
		}

		// Add records from a previous history.
		if (hasRecords) {
			this.#records.push(...records);
			for (const recordIndex in this.#records.slice(0, this.lastActiveIndex() + 1)) {
				this.#records[recordIndex] = this.#applyRecord(this.#records[recordIndex]);
			}
		}
	}

	/**
	 * @type {string}
	 */
	#initialValue;

	/**
	 * Check if a value is representative of its history records. If not,
	 * return what the value should actually be.
	 *
	 * @return {string}
	 */
	checkIntegrity = () => {
		const mirror = new LocalHistory(this.#initialValue || '');

		for (const record of this.#records.filter(x => x.active)) {
			mirror.push(record);
		}

		return mirror.getValue() === this.#value ? '' : mirror.getValue();
	};

	/**
	 * Keep track of every action of the editor.
	 *
	 * @type {HistoryRecord[]}
	 */
	#records = [];

	/**
	 * Current value of the string.
	 *
	 * @type {string}
	 */
	#value = '';

	/**
	 * Get the index of the last active record.
	 *
	 * @return {number}
	 */
	lastActiveIndex = () => this.#records.reduce((acc, record, idx) => record.active ? idx : acc, -1);

	/**
	 * @param {HistoryRecord} record
	 * @return {HistoryRecord}
	 */
	#revertRecord = record => {
		record.to = this.#value.slice(record.caret.start, record.caret.start + record.to.length);
		record.active = false;

		this.#value = this.#value.slice(0, record.caret.start) +
			record.from +
			this.#value.slice(record.caret.start + record.to.length);

		return record;
	};

	/**
	 * @param {HistoryRecord} record
	 * @return {HistoryRecord}
	 */
	#applyRecord = record => {
		record.from = this.#value.slice(record.caret.start, record.caret.end);
		record.active = true;

		this.#value = this.#value.slice(0, record.caret.start) +
			record.to +
			this.#value.slice(record.caret.end);

		return record;
	};

	/**
	 * Apply (redo) the first ct non active records.
	 *
	 * @param {number} ct
	 */
	apply = ct => {
		const last = this.lastActiveIndex() + 1; // We want the first non active one.
		for (let i = last; i < (last + ct) && i < this.#records.length; i++) {
			this.#records[i] = this.#applyRecord(this.#records[i]);
		}
	};

	/**
	 * Undo the last ct active records;
	 *
	 * @param {number} ct
	 */
	revert = ct => {
		const last = this.lastActiveIndex();
		for (let i = last; i > (last - ct) && i >= 0; i--) {
			this.#records[i] = this.#revertRecord(this.#records[i]);
		}
	};

	/**
	 * Apply each non active records while chain condition is true.
	 *
	 * @param {function(HistoryRecord, HistoryRecord): boolean} callback
	 */
	applyChain = callback => {
		let last = this.lastActiveIndex() + 1; // We want the first non active one.

		if (last < 0 || last >= this.#records.length) {
			return;
		}

		this.#records[last] = this.#applyRecord(this.#records[last]);

		while (last < (this.#records.length - 1) && callback(this.#records[last + 1], this.#records[last])) {
			last++;
			this.#records[last] = this.#applyRecord(this.#records[last]);
		}
	};

	/**
	 * Undo each active records while chain condition is true.
	 *
	 * @param {function(HistoryRecord, HistoryRecord): boolean} callback
	 */
	revertChain = callback => {
		let last = this.lastActiveIndex();

		if (last < 0) {
			return;
		}

		this.#records[last] = this.#revertRecord(this.#records[last]);

		while (last > 0 && callback(this.#records[last - 1], this.#records[last])) {
			last--;
			this.#records[last] = this.#revertRecord(this.#records[last]);
		}
	};

	/**
	 * Add a new record to the stack.
	 *
	 * @param {HistoryRecord} record
	 * @return {HistoryRecord}
	 */
	push = record => {
		this.#records = this.#records.filter(record => record.active);
		record = this.#applyRecord(record);
		this.#records.push(record);
		return record;
	};

	/**
	 * @return {HistoryRecord[]}
	 */
	getRecords = () => this.#records;

	/**
	 * @return {string}
	 */
	getValue = () => this.#value;

	/**
	 * Return true if string is only composed of white spaces.
	 *
	 * @param {string} str
	 * @return {boolean}
	 */
	static isBlank = str => str.length > 0 && str.trim().length === 0;

	/**
	 * Return true if string has a blank space or end of line character.
	 *
	 * @param {string} str
	 * @return {boolean}
	 */
	static hasBlank = str => str.includes(' ') || str.includes('\t') || str.includes('\n');

	/**
	 * Return true if records can be chained based on blank space rule.
	 *
	 * @param {HistoryRecord} a
	 * @param {HistoryRecord} b
	 * @return {boolean}
	 */
	static splitOnBlankSpace = (a, b) =>
		(LocalHistory.isBlank(a.to) && LocalHistory.isBlank(b.to)) ||
		(!LocalHistory.hasBlank(b.to) && !LocalHistory.hasBlank(a.to));

	/**
	 * Return true if records are siblings.
	 *
	 * @param {HistoryRecord} a
	 * @param {HistoryRecord} b
	 * @return {boolean}
	 */
	static keepContinuity = (a, b) =>
		a.caret.start === b.caret.end + 1 ||
		b.caret.start === a.caret.end + 1 ||
		a.caret.end === b.caret.start + 1 ||
		b.caret.end === a.caret.start + 1;
}

export default LocalHistory;