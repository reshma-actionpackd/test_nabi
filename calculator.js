const display = document.getElementById('display');
const keys = document.getElementById('keys');

const MAX_DISPLAY_LENGTH = 12;

const state = {
  displayValue: '0',
  firstOperand: null,
  operator: null,
  waitingForSecondOperand: false,
  error: false,
};

function updateDisplay() {
  display.textContent = state.displayValue;
  display.classList.toggle('display--error', state.error);
}

function reset() {
  state.displayValue = '0';
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  state.error = false;
  updateDisplay();
}

function formatNumber(value) {
  const str = String(value);
  if (!Number.isFinite(value)) return 'Error';

  if (str.includes('e')) {
    const fixed = value.toPrecision(MAX_DISPLAY_LENGTH);
    return fixed.length > MAX_DISPLAY_LENGTH
      ? fixed.slice(0, MAX_DISPLAY_LENGTH)
      : fixed;
  }

  const rounded = Math.round(value * 1e10) / 1e10;
  let result = String(rounded);

  if (result.length > MAX_DISPLAY_LENGTH) {
    result = rounded.toExponential(MAX_DISPLAY_LENGTH - 4);
    if (result.length > MAX_DISPLAY_LENGTH) {
      result = result.slice(0, MAX_DISPLAY_LENGTH);
    }
  }

  return result;
}

function compute(first, operator, second) {
  switch (operator) {
    case '+':
      return first + second;
    case '-':
      return first - second;
    case '*':
      return first * second;
    case '/':
      if (second === 0) return null;
      return first / second;
    default:
      return second;
  }
}

function setError() {
  state.error = true;
  state.displayValue = 'Error';
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  updateDisplay();
}

function inputDigit(digit) {
  if (state.error) return;

  if (state.waitingForSecondOperand) {
    state.displayValue = digit;
    state.waitingForSecondOperand = false;
    updateDisplay();
    return;
  }

  if (state.displayValue === '0') {
    state.displayValue = digit;
  } else if (state.displayValue.replace('-', '').length < MAX_DISPLAY_LENGTH) {
    state.displayValue += digit;
  }

  updateDisplay();
}

function inputDecimal() {
  if (state.error) return;

  if (state.waitingForSecondOperand) {
    state.displayValue = '0.';
    state.waitingForSecondOperand = false;
    updateDisplay();
    return;
  }

  if (!state.displayValue.includes('.')) {
    if (state.displayValue.replace('-', '').length < MAX_DISPLAY_LENGTH) {
      state.displayValue += '.';
    }
  }

  updateDisplay();
}

function inputSign() {
  if (state.error || state.displayValue === '0') return;

  if (state.displayValue.startsWith('-')) {
    state.displayValue = state.displayValue.slice(1);
  } else {
    state.displayValue = '-' + state.displayValue;
  }

  updateDisplay();
}

function inputPercent() {
  if (state.error) return;

  const value = parseFloat(state.displayValue);
  if (!Number.isFinite(value)) return;

  state.displayValue = formatNumber(value / 100);
  updateDisplay();
}

function inputSqrt() {
  if (state.error) return;

  const value = parseFloat(state.displayValue);
  if (!Number.isFinite(value) || value < 0) {
    setError();
    return;
  }

  state.displayValue = formatNumber(Math.sqrt(value));
  updateDisplay();
}

function handleOperator(nextOperator) {
  if (state.error) return;

  const inputValue = parseFloat(state.displayValue);

  if (state.operator && !state.waitingForSecondOperand) {
    const result = compute(state.firstOperand, state.operator, inputValue);

    if (result === null) {
      setError();
      return;
    }

    state.displayValue = formatNumber(result);
    state.firstOperand = result;
  } else {
    state.firstOperand = inputValue;
  }

  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
  updateDisplay();
}

function handleEquals() {
  if (state.error) return;

  if (state.operator == null || state.waitingForSecondOperand) {
    return;
  }

  const inputValue = parseFloat(state.displayValue);
  const result = compute(state.firstOperand, state.operator, inputValue);

  if (result === null) {
    setError();
    return;
  }

  state.displayValue = formatNumber(result);
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;
  updateDisplay();
}

function handleAction(action, value) {
  switch (action) {
    case 'digit':
      inputDigit(value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'equals':
      handleEquals();
      break;
    case 'clear':
      reset();
      break;
    case 'sign':
      inputSign();
      break;
    case 'percent':
      inputPercent();
      break;
    case 'sqrt':
      inputSqrt();
      break;
    default:
      break;
  }
}

keys.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, value } = button.dataset;
  handleAction(action, value);
});

const KEY_MAP = {
  '0': ['digit', '0'],
  '1': ['digit', '1'],
  '2': ['digit', '2'],
  '3': ['digit', '3'],
  '4': ['digit', '4'],
  '5': ['digit', '5'],
  '6': ['digit', '6'],
  '7': ['digit', '7'],
  '8': ['digit', '8'],
  '9': ['digit', '9'],
  '.': ['decimal'],
  '+': ['operator', '+'],
  '-': ['operator', '-'],
  '*': ['operator', '*'],
  '/': ['operator', '/'],
  Enter: ['equals'],
  '=': ['equals'],
  Escape: ['clear'],
  Backspace: ['backspace'],
};

document.addEventListener('keydown', (event) => {
  const mapping = KEY_MAP[event.key];
  if (!mapping) return;

  event.preventDefault();

  if (mapping[0] === 'backspace') {
    if (state.error) return;
    if (state.waitingForSecondOperand) return;

    if (state.displayValue.length <= 1 || state.displayValue === '-0') {
      state.displayValue = '0';
    } else if (state.displayValue.length === 2 && state.displayValue.startsWith('-')) {
      state.displayValue = '0';
    } else {
      state.displayValue = state.displayValue.slice(0, -1);
      if (state.displayValue === '' || state.displayValue === '-') {
        state.displayValue = '0';
      }
    }
    updateDisplay();
    return;
  }

  handleAction(mapping[0], mapping[1]);
});

updateDisplay();
