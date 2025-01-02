export const typography = {
  DEFAULT: {
    css: {
      maxWidth: '65ch',
      color: 'var(--tw-prose-body)',
      '[class~="lead"]': {
        color: 'var(--tw-prose-lead)',
      },
      a: {
        color: 'var(--tw-prose-links)',
        textDecoration: 'underline',
        fontWeight: '500',
      },
      strong: {
        color: 'var(--tw-prose-bold)',
        fontWeight: '600',
      },
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
        paddingLeft: '1.75em',
      },
      'ol > li::before': {
        content: 'counter(list-item, var(--list-counter-style, decimal)) "."',
        position: 'absolute',
        fontWeight: '400',
        color: 'var(--tw-prose-counters)',
        left: '0',
      },
      'ul > li': {
        position: 'relative',
        paddingLeft: '1.5rem',
        '&::before': {
          display: 'none',
        },
      },
      hr: {
        borderColor: 'var(--tw-prose-hr)',
        borderTopWidth: 1,
        marginTop: '3em',
        marginBottom: '3em',
      },
      blockquote: {
        fontWeight: '500',
        fontStyle: 'italic',
        color: 'var(--tw-prose-quotes)',
        borderLeftWidth: '0.25rem',
        borderLeftColor: 'var(--tw-prose-quote-borders)',
        quotes: '"\\201C""\\201D""\\2018""\\2019"',
        marginTop: '1.6em',
        marginBottom: '1.6em',
        paddingLeft: '1em',
      },
      h1: {
        color: 'var(--tw-prose-headings)',
        fontWeight: '800',
        fontSize: '2.25em',
        marginTop: '0',
        marginBottom: '0.8888889em',
        lineHeight: '1.1111111',
      },
      h2: {
        color: 'var(--tw-prose-headings)',
        fontWeight: '700',
        fontSize: '1.5em',
        marginTop: '2em',
        marginBottom: '1em',
        lineHeight: '1.3333333',
      },
      h3: {
        color: 'var(--tw-prose-headings)',
        fontWeight: '600',
        fontSize: '1.25em',
        marginTop: '1.6em',
        marginBottom: '0.6em',
        lineHeight: '1.6',
      },
      h4: {
        color: 'var(--tw-prose-headings)',
        fontWeight: '600',
        marginTop: '1.5em',
        marginBottom: '0.5em',
        lineHeight: '1.5',
      },
      figure: {
        marginTop: '2em',
        marginBottom: '2em',
      },
      'figure > *': {
        marginTop: '0',
        marginBottom: '0',
      },
      figcaption: {
        color: 'var(--tw-prose-captions)',
        fontSize: '0.875em',
        lineHeight: '1.4285714',
        marginTop: '0.8571429em',
      },
      code: {
        color: 'var(--tw-prose-code)',
        fontWeight: '600',
        fontSize: '0.875em',
      },
      'code::before': {
        content: '"`"',
      },
      'code::after': {
        content: '"`"',
      },
      'a code': {
        color: 'var(--tw-prose-links)',
      },
      pre: {
        color: 'var(--tw-prose-pre-code)',
        backgroundColor: 'var(--tw-prose-pre-bg)',
        overflowX: 'auto',
        fontWeight: '400',
        fontSize: '0.875em',
        lineHeight: '1.7142857',
        marginTop: '1.7142857em',
        marginBottom: '1.7142857em',
        borderRadius: '0.375rem',
        paddingTop: '0.8571429em',
        paddingRight: '1.1428571em',
        paddingBottom: '0.8571429em',
        paddingLeft: '1.1428571em',
      },
      'pre code': {
        backgroundColor: 'transparent',
        borderWidth: '0',
        borderRadius: '0',
        padding: '0',
        fontWeight: 'inherit',
        color: 'inherit',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
      },
      'pre code::before': {
        content: 'none',
      },
      'pre code::after': {
        content: 'none',
      },
      table: {
        width: '100%',
        tableLayout: 'auto',
        textAlign: 'left',
        marginTop: '2em',
        marginBottom: '2em',
      },
      thead: {
        borderBottomWidth: '1px',
        borderBottomColor: 'var(--tw-prose-th-borders)',
      },
      'thead th': {
        color: 'var(--tw-prose-headings)',
        fontWeight: '600',
        verticalAlign: 'bottom',
        paddingRight: '0.5714286em',
        paddingBottom: '0.5714286em',
        paddingLeft: '0.5714286em',
      },
      'thead th:first-child': {
        paddingLeft: '0',
      },
      'thead th:last-child': {
        paddingRight: '0',
      },
      'tbody tr': {
        borderBottomWidth: '1px',
        borderBottomColor: 'var(--tw-prose-td-borders)',
      },
      'tbody tr:last-child': {
        borderBottomWidth: '0',
      },
      'tbody td': {
        verticalAlign: 'baseline',
        paddingTop: '0.5714286em',
        paddingRight: '0.5714286em',
        paddingBottom: '0.5714286em',
        paddingLeft: '0.5714286em',
      },
      'tbody td:first-child': {
        paddingLeft: '0',
      },
      'tbody td:last-child': {
        paddingRight: '0',
      },
    },
  },
};
