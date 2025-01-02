export const listTypography = {
  'ol[type="A"]': {
    '--list-counter-style': 'upper-alpha',
  },
  'ol[type="a"]': {
    '--list-counter-style': 'lower-alpha',
  },
  'ol[type="A" s]': {
    '--list-counter-style': 'upper-alpha',
  },
  'ol[type="a" s]': {
    '--list-counter-style': 'lower-alpha',
  },
  'ol[type="I"]': {
    '--list-counter-style': 'upper-roman',
  },
  'ol[type="i"]': {
    '--list-counter-style': 'lower-roman',
  },
  'ol[type="I" s]': {
    '--list-counter-style': 'upper-roman',
  },
  'ol[type="i" s]': {
    '--list-counter-style': 'lower-roman',
  },
  'ol[type="1"]': {
    '--list-counter-style': 'decimal',
  },
  'ol > li': {
    position: 'relative',
    paddingLeft: '2.5em',
    counterIncrement: 'list-item',
    listStyle: 'none'
  },
  'ol > li::before': {
    content: 'counter(list-item, var(--list-counter-style, decimal)) "."',
    position: 'absolute',
    fontWeight: '400',
    color: 'var(--tw-prose-counters)',
    left: '0.5em',
  },
  'ul > li': {
    position: 'relative',
    paddingLeft: '1.5rem',
    '&::before': {
      display: 'none',
    },
  }
};