export const listTypography = {
  'ul': {
    listStyleType: 'disc',
    paddingLeft: '1.5em',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  'ul > li': {
    position: 'relative',
    paddingLeft: '0.5em',
    marginBottom: '0.25em',
  },
  'ol': {
    listStyleType: 'decimal',
    paddingLeft: '1.5em',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  'ol > li': {
    position: 'relative',
    paddingLeft: '0.5em',
    marginBottom: '0.25em',
  },
  'ol[type="A"]': {
    listStyleType: 'upper-alpha',
  },
  'ol[type="a"]': {
    listStyleType: 'lower-alpha',
  },
  'ol[type="I"]': {
    listStyleType: 'upper-roman',
  },
  'ol[type="i"]': {
    listStyleType: 'lower-roman',
  },
  // Nested lists
  'ul ul, ol ul': {
    marginTop: '0.25em',
    marginBottom: '0.25em',
  },
  'ul ol, ol ol': {
    marginTop: '0.25em',
    marginBottom: '0.25em',
  }
};