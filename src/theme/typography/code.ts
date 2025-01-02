export const codeTypography = {
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
  }
};