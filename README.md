# Records

<div align="center">
    <a href="https://www.npmjs.com/package/@anovel/records">
        <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@anovel/records?style=for-the-badge">
    </a>
    <a href="https://github.com/a-novel/records/blob/master/LICENSE">    
        <img alt="GitHub" src="https://img.shields.io/github/license/a-novel/records?style=for-the-badge">
    </a>
</div>

<div align="center">
    <a href="https://codecov.io/gh/a-novel/records">
        <img alt="Codecov" src="https://img.shields.io/codecov/c/github/a-novel/records?style=flat-square">
    </a>
    <img alt="David" src="https://img.shields.io/david/dev/a-novel/records?style=flat-square">
    <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@anovel/records?style=flat-square">
</div>
<br/>

History record tools for undo/redo custom algorithms.

- [LocalHistory](#localhistory)
    - [Constructor](#localhistoryconstructor)
- [License](#license)

# LocalHistory

Record input for a single local user.

<h2 id="localhistoryconstructor">Constructor</h2>

```javascript
import {LocalHistory} from '@anovel/records';

const recorder = new LocalHistory();
```

Constructor takes 2 optional parameters.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| content | string | Initial value of the string. User cannot rollback past this value, which serves as a starting point for the record history. |
| records | [][Record](#record-object) | An array of records to initialize recorder with. Those records are applied automatically, so they will alter the initial value, if provided. Records with `active:false` will be ignored. |

```javascript
import {LocalHistory} from '@anovel/records';

const recorder = new LocalHistory('', [
  {to: 'hello', caret: {start: 0, end: 0}, active: true}, // Will be applied.
  {to: 'world', caret: {start: 5, end: 5}, active: false}, // Will not be applied.
  {to: ' ', caret: {start: 5, end: 5}, active: true} // Will not be applied, since no active record should follow a non active one.
]);

// recorder.getValue() will return 'hello'.
```



### Record Object

A record is an object with the following properties:

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| caret | {start: number, end: number} | true | Indicates where the alteration took place within the string. |
| from | string | - | The original value that was replaced by the alteration.<br/>This key should be used for read only in custom rollback functions, as it is overridden by LocalHistory handlers. |
| to | string | true | The value that was added by the alteration. Can be an empty string. |
| active | boolean | - | Indicates whether the record is applied or not (on undo, undone record is set to `active:false`). |

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/records/blob/master/LICENSE).