export const blockTypography = {
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
  }
};