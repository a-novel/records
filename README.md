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
    - [Interact with records](#interact-with-records)
        - [Record Object](#record-object)
        - [Add entry](#add-entry)
        - [Navigate in history](#navigate-in-history)
            - [Basic handlers](#basic-handlers)
            - [Chained handlers](#chained-handlers)
                - [Default chainers](#default-chainers)
                    - [splitOnBlankSpace](#splitonblankspace)
                    - [keepContinuity](#keepcontinuity)
        - [Accessors](#accessors)
        - [Special handlers](#special-handlers)
            - [lastActiveIndex](#lastactiveindex)
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

## Interact with records

### Record Object

A record is an object with the following properties:

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| caret | {start: number, end: number} | true | Indicates where the alteration took place within the string. |
| from | string | - | The original value that was replaced by the alteration.<br/>This key should be used for read only in custom rollback functions, as it is overridden by LocalHistory handlers. |
| to | string | true | The value that was added by the alteration. Can be an empty string. |
| active | boolean | - | Indicates whether the record is applied or not (on undo, undone record is set to `active:false`). |

### Add entry

To add a [Record Object](#record-object) to the history, you may use the `push` method.

```javascript
// push() may add information or alter the current record.
recordObject = recorder.push(recordObject);
```

### Navigate in history

Recorder provides several ways to interact with your record history.

#### Basic handlers

You can use `apply` and `revert` methods to navigate within your history. Both take
a required number parameter.

```javascript
// Undo the 3 last entries.
recorder.revert(3);

// Redo the 2 last ones.
recorder.apply(2);

// The whole code will have the same effect than recorder.revert(1)
```

#### Chained handlers

Chained handlers will allow you to perform undo/redo operations grouped under a
certain condition. They both take a single callback argument that returns a boolean.

```javascript
recorder.applyChain((nextRecord, currentRecord) => boolean);
recorder.revertChain((previousRecord, currentRecord) => boolean);
```

This will undo/redo first argument while the returned condition is true. It performs
at least one undo/redo operation to allow comparison.

##### Default chainers

LocalHistory provides default chaining static methods. They can be used to quickly
setup powerful undo/redo algorithms.

The following examples will use this record chain sample:

```text
'h'                       -> {to: 'h', caret: {start: 0, end: 0}}
'he'                      -> {to: 'e', caret: {start: 1, end: 1}}
'hel'                     -> {to: 'l', caret: {start: 2, end: 2}}
'hell'                    -> {to: 'l', caret: {start: 3, end: 3}}
'hello'                   -> {to: 'o', caret: {start: 4, end: 4}}
'hello '                  -> {to: ' ', caret: {start: 5, end: 5}}
'hello w'                 -> {to: 'w', caret: {start: 6, end: 6}}
'hello wo'                -> {to: 'o', caret: {start: 7, end: 7}}
'hello wor'               -> {to: 'r', caret: {start: 8, end: 8}}
'hello worl'              -> {to: 'l', caret: {start: 9, end: 9}}
'hello world'             -> {to: 'd', caret: {start: 10, end: 10}}
'hellon world'            -> {to: 'n', caret: {start: 5, end: 5}}
'hellone world'           -> {to: 'e', caret: {start: 6, end: 6}}
'hellonew world'          -> {to: 'w', caret: {start: 7, end: 7}}
'hellobnew world'         -> {to: 'b', caret: {start: 5, end: 5}}
'hellobrnew world'        -> {to: 'r', caret: {start: 6, end: 6}}
'hellobranew world'       -> {to: 'a', caret: {start: 7, end: 7}}
'hellobrannew world'      -> {to: 'n', caret: {start: 8, end: 8}}
'hellobrandnew world'     -> {to: 'd', caret: {start: 9, end: 9}}
'hellobrand new world'    -> {to: ' ', caret: {start: 10, end: 10}}
'hello brand new world'   -> {to: ' ', caret: {start: 5, end: 5}}
```

###### splitOnBlankSpace

Group characters by words.

```javascript
// 'hello brand new world' -> 'hellobrand new world'
recorder.revertChain(LocalHistory.splitOnBlankSpace);

// Following calls will produce:
// 'hellobrand new world' -> 'hellobrandnew world'
// 'hellobrandnew world' -> 'hello '
// 'hello ' -> 'hello'
// 'hello' -> ''
```

###### keepContinuity

Stop when 2 records aren't siblings.

```javascript
// 'hello brand new world' -> 'hellobrand new world'
recorder.revertChain(LocalHistory.keepContinuity);

// Following calls will produce:
// 'hellobrand new world' -> 'hellobrandnew world'
// 'hellobrandnew world' -> 'hellonew world'
// 'hellonew world' -> 'hello world'
// 'hello world' -> ''
```

### Accessors

Recorder class variables are made private for security issues, but you can access a
copy of them with the following accessors.

```javascript
// Returns the current value of the input string.
recorder.getValue();

// Returns a copy of the current list of records.
recorder.getRecords();
```

### Special handlers

#### lastActiveIndex

Returns the index of the last active record. Please be aware to be considered active,
a record should only be preceded by active records. Given the following (broken)
record chain:

```json
[
  {"to":  "hello", "active": true, ...},
  {"to":  " ", "active": false, ...},
  {"to":  "world", "active": true, ...}
]
```

`recorder.lastActiveIndex()` will return 0 (since element at index 2 is preceded by
a non active record).

#### checkIntegrity

Check if the current record history leads to the current value when applied. Returns
the correct value in case something went wrong. Should always return blank string.

```javascript
// Should return ''
const output = recorder.checkIntegrity();
```

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/records/blob/master/LICENSE).